import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";
import { logger } from "../utils/logger.js";

export class InventoryService {
  /**
   * List item master records with optional search and category filters
   */
  static async listItems({ search, category, status } = {}) {
    let items = await db.collection("items").find();

    if (status && status !== "All") {
      items = items.filter((i) => i.status.toLowerCase() === status.toLowerCase());
    }

    if (category && category !== "All") {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.code.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    return items;
  }

  /**
   * Get single item details by code or ID
   */
  static async getItem(codeOrId) {
    const item = await db.collection("items").findOne(
      (i) => i.code === codeOrId || i.id === codeOrId
    );
    if (!item) {
      const err = new Error(`Item ${codeOrId} not found`);
      err.status = 404;
      throw err;
    }

    // Attach current onhand stock balances across subinventories
    const onhand = await db.collection("inventory_onhand").find((o) => o.itemCode === item.code);
    const totalOnhand = onhand.reduce((sum, o) => sum + (o.onhandQty || 0), 0);
    const totalAvailable = onhand.reduce((sum, o) => sum + (o.availableQty || 0), 0);

    // Attach BOM if exists
    const bom = item.bomId ? await db.collection("boms").findOne((b) => b.id === item.bomId || b.code === item.bomId) : null;

    // Attach Routing if exists
    const routing = item.routingId ? await db.collection("routings").findOne((r) => r.id === item.routingId || r.code === item.routingId) : null;

    return {
      ...item,
      totalOnhand,
      totalAvailable,
      onhandBreakdown: onhand,
      bom,
      routing,
    };
  }

  /**
   * Create or update item in item master
   */
  static async createItem(data, user) {
    if (!data.code || !data.name || !data.category) {
      const err = new Error("Item code, name, and category are required");
      err.status = 400;
      throw err;
    }

    const existing = await db.collection("items").findOne((i) => i.code === data.code);
    if (existing) {
      const err = new Error(`Item code ${data.code} already exists`);
      err.status = 409;
      throw err;
    }

    const newItem = await db.collection("items").insert({
      id: data.code,
      code: data.code,
      name: data.name,
      description: data.description || "",
      category: data.category,
      uom: data.uom || "EA",
      standardCost: Number(data.standardCost) || 0,
      listPrice: Number(data.listPrice) || 0,
      makeOrBuy: data.makeOrBuy || "Buy",
      leadTimeDays: Number(data.leadTimeDays) || 3,
      safetyStock: Number(data.safetyStock) || 0,
      minOrderQty: Number(data.minOrderQty) || 1,
      reorderPoint: Number(data.reorderPoint) || 0,
      status: "Active",
      preferredSupplierId: data.preferredSupplierId || null,
      bomId: data.bomId || null,
      routingId: data.routingId || null,
      createdBy: user?.name || "System",
    });

    await db.collection("audit_logs").insert({
      timestamp: new Date().toISOString(),
      userId: user?.id || "sys",
      userName: user?.name || "System",
      role: user?.role || "mgr.stores",
      action: "ITEM_CREATE",
      entityType: "ITEM",
      entityId: newItem.code,
      details: `Created item master entry for ${newItem.code} - ${newItem.name}`,
    });

    return newItem;
  }

  /**
   * Get on-hand inventory balances with analytical summaries
   */
  static async getOnhand({ itemCode, subinventory } = {}) {
    let records = await db.collection("inventory_onhand").find();

    if (itemCode) {
      records = records.filter((r) => r.itemCode.toLowerCase() === itemCode.toLowerCase());
    }

    if (subinventory && subinventory !== "All") {
      records = records.filter((r) => r.subinventory.toLowerCase() === subinventory.toLowerCase());
    }

    const totalValuation = records.reduce((sum, r) => sum + (r.totalValue || r.onhandQty * (r.unitCost || 0)), 0);
    const totalQuantity = records.reduce((sum, r) => sum + (r.onhandQty || 0), 0);
    const totalReserved = records.reduce((sum, r) => sum + (r.reservedQty || 0), 0);
    const totalAvailable = records.reduce((sum, r) => sum + (r.availableQty || 0), 0);

    return {
      records,
      summary: {
        totalRecords: records.length,
        totalValuation,
        totalQuantity,
        totalReserved,
        totalAvailable,
      },
    };
  }

  /**
   * Get all subinventories
   */
  static async getSubinventories() {
    return db.collection("subinventories").find();
  }

  /**
   * Get inventory transactions history
   */
  static async getTransactions({ itemCode, type, limit = 50 } = {}) {
    let txns = await db.collection("inventory_transactions").find();

    if (itemCode) {
      txns = txns.filter((t) => t.itemCode.toLowerCase() === itemCode.toLowerCase());
    }

    if (type && type !== "All") {
      txns = txns.filter((t) => t.type.toLowerCase() === type.toLowerCase());
    }

    // Sort newest first
    txns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return txns.slice(0, Number(limit));
  }

  /**
   * Execute subinventory transfer (validates available stock and prevents negative inventory)
   */
  static async transferSubinventory({ itemCode, fromSubinventory, toSubinventory, quantity, reference }, user) {
    const qty = Number(quantity);
    if (!itemCode || !fromSubinventory || !toSubinventory || qty <= 0) {
      const err = new Error("Invalid transfer parameters: Item, from/to subinventories, and positive quantity required");
      err.status = 400;
      throw err;
    }

    if (fromSubinventory === toSubinventory) {
      const err = new Error("Source and destination subinventories must be different");
      err.status = 400;
      throw err;
    }

    // Check available source stock
    const sourceRecord = await db.collection("inventory_onhand").findOne(
      (r) => r.itemCode === itemCode && r.subinventory === fromSubinventory
    );

    if (!sourceRecord || sourceRecord.availableQty < qty) {
      const available = sourceRecord ? sourceRecord.availableQty : 0;
      const err = new Error(`Insufficient stock in ${fromSubinventory}. Available: ${available}, Requested: ${qty}`);
      err.status = 400;
      throw err;
    }

    // Deduct from source
    await db.collection("inventory_onhand").update(
      (r) => r.id === sourceRecord.id,
      {
        onhandQty: sourceRecord.onhandQty - qty,
        availableQty: sourceRecord.availableQty - qty,
        totalValue: (sourceRecord.onhandQty - qty) * sourceRecord.unitCost,
      }
    );

    // Add or increment destination
    const destRecord = await db.collection("inventory_onhand").findOne(
      (r) => r.itemCode === itemCode && r.subinventory === toSubinventory
    );

    if (destRecord) {
      await db.collection("inventory_onhand").update(
        (r) => r.id === destRecord.id,
        {
          onhandQty: destRecord.onhandQty + qty,
          availableQty: destRecord.availableQty + qty,
          totalValue: (destRecord.onhandQty + qty) * destRecord.unitCost,
        }
      );
    } else {
      await db.collection("inventory_onhand").insert({
        id: `ONH-${Date.now()}`,
        itemCode,
        itemName: sourceRecord.itemName,
        subinventory: toSubinventory,
        locator: toSubinventory.includes("WIP") ? "WIP-01" : "BAY-01",
        onhandQty: qty,
        reservedQty: 0,
        availableQty: qty,
        uom: sourceRecord.uom,
        unitCost: sourceRecord.unitCost,
        totalValue: qty * sourceRecord.unitCost,
      });
    }

    // Record transaction
    const txnNumber = `TXN-${Date.now().toString().slice(-6)}`;
    const txn = await db.collection("inventory_transactions").insert({
      id: txnNumber,
      txnNumber,
      type: "SUBINVENTORY_TRANSFER",
      itemCode,
      itemName: sourceRecord.itemName,
      fromSubinventory,
      toSubinventory,
      quantity: qty,
      uom: sourceRecord.uom,
      reference: reference || "Standard Stock Transfer",
      createdBy: user?.name || "System",
      createdAt: new Date().toISOString(),
    });

    await db.collection("audit_logs").insert({
      timestamp: new Date().toISOString(),
      userId: user?.id || "sys",
      userName: user?.name || "System",
      role: user?.role || "stores.controller",
      action: "INVENTORY_TRANSFER",
      entityType: "STOCK",
      entityId: itemCode,
      details: `Transferred ${qty} ${sourceRecord.uom} of ${itemCode} from ${fromSubinventory} to ${toSubinventory}`,
    });

    return txn;
  }

  /**
   * Record miscellaneous receipt or issue
   */
  static async recordMiscellaneous({ type, itemCode, subinventory, quantity, reason }, user) {
    const qty = Number(quantity);
    if (!["MISC_RECEIPT", "MISC_ISSUE"].includes(type) || !itemCode || !subinventory || qty <= 0) {
      const err = new Error("Invalid transaction parameters");
      err.status = 400;
      throw err;
    }

    const item = await db.collection("items").findOne((i) => i.code === itemCode);
    if (!item) {
      const err = new Error(`Item ${itemCode} not found`);
      err.status = 404;
      throw err;
    }

    const onhand = await db.collection("inventory_onhand").findOne(
      (r) => r.itemCode === itemCode && r.subinventory === subinventory
    );

    if (type === "MISC_ISSUE") {
      if (!onhand || onhand.availableQty < qty) {
        const available = onhand ? onhand.availableQty : 0;
        const err = new Error(`Insufficient stock for issue in ${subinventory}. Available: ${available}, Requested: ${qty}`);
        err.status = 400;
        throw err;
      }
      await db.collection("inventory_onhand").update((r) => r.id === onhand.id, {
        onhandQty: onhand.onhandQty - qty,
        availableQty: onhand.availableQty - qty,
        totalValue: (onhand.onhandQty - qty) * onhand.unitCost,
      });
    } else {
      if (onhand) {
        await db.collection("inventory_onhand").update((r) => r.id === onhand.id, {
          onhandQty: onhand.onhandQty + qty,
          availableQty: onhand.availableQty + qty,
          totalValue: (onhand.onhandQty + qty) * onhand.unitCost,
        });
      } else {
        await db.collection("inventory_onhand").insert({
          id: `ONH-${Date.now()}`,
          itemCode,
          itemName: item.name,
          subinventory,
          locator: "A-01",
          onhandQty: qty,
          reservedQty: 0,
          availableQty: qty,
          uom: item.uom,
          unitCost: item.standardCost,
          totalValue: qty * item.standardCost,
        });
      }
    }

    const txnNumber = `TXN-${Date.now().toString().slice(-6)}`;
    return db.collection("inventory_transactions").insert({
      id: txnNumber,
      txnNumber,
      type,
      itemCode,
      itemName: item.name,
      fromSubinventory: type === "MISC_ISSUE" ? subinventory : null,
      toSubinventory: type === "MISC_RECEIPT" ? subinventory : null,
      quantity: qty,
      uom: item.uom,
      reference: reason || "Miscellaneous Inventory Adjustment",
      createdBy: user?.name || "System",
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Get cycle count audits
   */
  static async getCycleCounts() {
    return [
      { id: "CC-2026-10", name: "October Monthly High-Value Cycle Count", subinventory: "RM-STORES", scheduledDate: "2026-10-15", status: "Completed", accuracyRate: 99.4, varianceCount: 1, auditor: "Pooja Nair" },
      { id: "CC-2026-11", name: "November Pre-Planned Finished Goods Audit", subinventory: "FG-WAREHOUSE", scheduledDate: "2026-11-02", status: "Scheduled", accuracyRate: null, varianceCount: 0, auditor: "Kavita More" },
    ];
  }

  /**
   * Get material issues for work order
   */
  static async getMaterialIssues(workOrderId) {
    if (workOrderId) {
      return db.collection("material_issues").find((m) => m.workOrderId === workOrderId);
    }
    return db.collection("material_issues").find();
  }

  /**
   * Issue material to shop floor work order
   */
  static async issueMaterial({ workOrderId, itemCode, quantity, subinventory }, user) {
    const qty = Number(quantity);
    const issueRecord = await db.collection("material_issues").findOne(
      (m) => m.workOrderId === workOrderId && m.itemCode === itemCode
    );

    if (!issueRecord) {
      const err = new Error(`Material requirement for ${itemCode} on ${workOrderId} not found`);
      err.status = 404;
      throw err;
    }

    const stockSubinv = subinventory || issueRecord.subinventory;
    const stock = await db.collection("inventory_onhand").findOne(
      (s) => s.itemCode === itemCode && s.subinventory === stockSubinv
    );

    if (!stock || stock.availableQty < qty) {
      const available = stock ? stock.availableQty : 0;
      const err = new Error(`Insufficient stock in ${stockSubinv} to issue ${qty} ${issueRecord.uom}. Available: ${available}`);
      err.status = 400;
      throw err;
    }

    // Deduct stock
    await db.collection("inventory_onhand").update((s) => s.id === stock.id, {
      onhandQty: stock.onhandQty - qty,
      availableQty: stock.availableQty - qty,
      totalValue: (stock.onhandQty - qty) * stock.unitCost,
    });

    // Update material issue line
    const newIssued = issueRecord.issuedQty + qty;
    const newStatus = newIssued >= issueRecord.requiredQty ? "Fully Issued" : "Partially Issued";
    await db.collection("material_issues").update((m) => m.id === issueRecord.id, {
      issuedQty: newIssued,
      status: newStatus,
    });

    // Record txn
    const txnNumber = `TXN-${Date.now().toString().slice(-6)}`;
    await db.collection("inventory_transactions").insert({
      id: txnNumber,
      txnNumber,
      type: "WIP_ISSUE",
      itemCode,
      itemName: issueRecord.itemName,
      fromSubinventory: stockSubinv,
      toSubinventory: "WIP-STAGING",
      quantity: qty,
      uom: issueRecord.uom,
      reference: workOrderId,
      createdBy: user?.name || "System",
      createdAt: new Date().toISOString(),
    });

    return {
      message: `Successfully issued ${qty} ${issueRecord.uom} of ${itemCode} to ${workOrderId}`,
      issuedQty: newIssued,
      status: newStatus,
    };
  }
}

