import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";
import { logger } from "../utils/logger.js";
import { InventoryService } from "./inventoryService.js";

export class MfgService {
  /**
   * List Bills of Materials
   */
  static async listBoms({ search, status } = {}) {
    let boms = await db.collection("boms").find();

    if (status && status !== "All") {
      boms = boms.filter((b) => b.status.toLowerCase() === status.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      boms = boms.filter(
        (b) =>
          b.code.toLowerCase().includes(q) ||
          b.itemCode.toLowerCase().includes(q) ||
          b.itemName.toLowerCase().includes(q)
      );
    }

    return boms.map((b) => ({
      ...b,
      componentsCount: b.components ? b.components.length : 0,
    }));
  }

  /**
   * Get BOM details by code or ID
   */
  static async getBom(codeOrId) {
    const bom = await db.collection("boms").findOne(
      (b) => b.id === codeOrId || b.code === codeOrId || b.itemCode === codeOrId
    );
    if (!bom) {
      const err = new Error(`Bill of Materials ${codeOrId} not found`);
      err.status = 404;
      throw err;
    }

    // Attach routing information for the same item
    const routing = await db.collection("routings").findOne((r) => r.itemCode === bom.itemCode);

    return {
      ...bom,
      routing,
    };
  }

  /**
   * Create a new BOM
   */
  static async createBom(data, user) {
    if (!data.code || !data.itemCode || !Array.isArray(data.components)) {
      const err = new Error("BOM code, itemCode, and components array are required");
      err.status = 400;
      throw err;
    }

    const item = await db.collection("items").findOne((i) => i.code === data.itemCode);
    const bom = await db.collection("boms").insert({
      id: data.code,
      code: data.code,
      itemCode: data.itemCode,
      itemName: item ? item.name : (data.itemName || data.itemCode),
      revision: data.revision || "A",
      status: "Active",
      effectiveFrom: data.effectiveFrom || new Date().toISOString().split("T")[0],
      yieldPercent: Number(data.yieldPercent) || 98.0,
      description: data.description || `Standard production BOM for ${data.itemCode}`,
      components: data.components.map((c, index) => ({
        id: `BOMC-${Date.now()}-${index}`,
        itemCode: c.itemCode,
        itemName: c.itemName || c.itemCode,
        quantityPer: Number(c.quantityPer) || 1,
        uom: c.uom || "EA",
        scrapPercent: Number(c.scrapPercent) || 0,
        operationSeq: Number(c.operationSeq) || 10,
        isCritical: !!c.isCritical,
      })),
    });

    if (item) {
      await db.collection("items").update((i) => i.code === item.code, { bomId: bom.code });
    }

    return bom;
  }

  /**
   * List manufacturing routings
   */
  static async listRoutings() {
    return db.collection("routings").find();
  }

  /**
   * Get single routing details
   */
  static async getRouting(codeOrId) {
    const routing = await db.collection("routings").findOne(
      (r) => r.id === codeOrId || r.code === codeOrId || r.itemCode === codeOrId
    );
    if (!routing) {
      const err = new Error(`Routing ${codeOrId} not found`);
      err.status = 404;
      throw err;
    }
    return routing;
  }

  /**
   * List all work centers
   */
  static async listWorkCenters() {
    return db.collection("work_centers").find();
  }

  /**
   * List work orders with filtering
   */
  static async listWorkOrders({ search, status, itemCode } = {}) {
    let orders = await db.collection("work_orders").find();

    if (status && status !== "All") {
      orders = orders.filter((o) => o.status.toLowerCase() === status.toLowerCase());
    }

    if (itemCode) {
      orders = orders.filter((o) => o.itemCode.toLowerCase() === itemCode.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.itemCode.toLowerCase().includes(q) ||
          o.itemName.toLowerCase().includes(q) ||
          (o.supervisor && o.supervisor.toLowerCase().includes(q))
      );
    }

    return orders;
  }

  /**
   * Get detailed work order with operations and pick list
   */
  static async getWorkOrder(idOrCode) {
    const wo = await db.collection("work_orders").findOne(
      (o) => o.id === idOrCode || o.code === idOrCode
    );
    if (!wo) {
      const err = new Error(`Work Order ${idOrCode} not found`);
      err.status = 404;
      throw err;
    }

    // Fetch operations
    const operations = await db.collection("work_order_operations").find((op) => op.workOrderId === wo.code);
    operations.sort((a, b) => a.seq - b.seq);

    // Fetch material requirements and issue status
    const materials = await db.collection("material_issues").find((m) => m.workOrderId === wo.code);

    // Fetch BOM
    const bom = wo.bomId ? await db.collection("boms").findOne((b) => b.code === wo.bomId || b.id === wo.bomId) : null;

    return {
      ...wo,
      operations,
      materials,
      bom,
    };
  }

  /**
   * Create a new work order
   */
  static async createWorkOrder(data, user) {
    const plannedQty = Number(data.plannedQty);
    if (!data.itemCode || plannedQty <= 0) {
      const err = new Error("Item code and positive planned quantity are required");
      err.status = 400;
      throw err;
    }

    const item = await db.collection("items").findOne((i) => i.code === data.itemCode);
    if (!item) {
      const err = new Error(`Item ${data.itemCode} does not exist`);
      err.status = 404;
      throw err;
    }

    const bom = await db.collection("boms").findOne((b) => b.itemCode === item.code);
    const routing = await db.collection("routings").findOne((r) => r.itemCode === item.code);

    const woCode = `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newWo = await db.collection("work_orders").insert({
      id: woCode,
      code: woCode,
      itemCode: item.code,
      itemName: item.name,
      plannedQty,
      completedQty: 0,
      scrappedQty: 0,
      uom: item.uom,
      status: "Released",
      routingId: routing ? routing.code : null,
      bomId: bom ? bom.code : null,
      currentOpSeq: routing?.operations?.[0]?.seq || 10,
      currentOpName: routing?.operations?.[0]?.name || "Initial Operation",
      startDate: data.startDate || new Date().toISOString().split("T")[0],
      dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      assignedLine: data.assignedLine || "Pune Brake Pad Line 1",
      supervisor: data.supervisor || user?.name || "Sanjay Bhosale",
      priority: data.priority || "Normal",
      completionPercent: 0,
      createdBy: user?.name || "System",
    });

    // Populate work order operations from routing
    if (routing && Array.isArray(routing.operations)) {
      for (const op of routing.operations) {
        await db.collection("work_order_operations").insert({
          id: `WOOP-${Date.now()}-${op.seq}`,
          workOrderId: woCode,
          seq: op.seq,
          name: op.name,
          workCenter: op.workCenter,
          status: op.seq === routing.operations[0].seq ? "In Progress" : "Pending",
          plannedQty,
          completedQty: 0,
          scrappedQty: 0,
          operator: user?.name || "Rahul Patil",
          completedAt: null,
        });
      }
    }

    // Populate material requirements from BOM
    if (bom && Array.isArray(bom.components)) {
      for (const comp of bom.components) {
        const requiredQty = comp.quantityPer * plannedQty * (1 + (comp.scrapPercent || 0) / 100);
        await db.collection("material_issues").insert({
          id: `MI-${Date.now()}-${comp.itemCode}`,
          workOrderId: woCode,
          itemCode: comp.itemCode,
          itemName: comp.itemName,
          requiredQty: Math.round(requiredQty * 100) / 100,
          issuedQty: 0,
          uom: comp.uom,
          subinventory: comp.itemCode.startsWith("SA-") ? "WIP-STAGING" : "RM-STORES",
          status: "Pending",
        });
      }
    }

    await db.collection("audit_logs").insert({
      timestamp: new Date().toISOString(),
      userId: user?.id || "sys",
      userName: user?.name || "System",
      role: user?.role || "mgr.production",
      action: "WORK_ORDER_CREATE",
      entityType: "WORK_ORDER",
      entityId: woCode,
      details: `Created and released work order ${woCode} for ${plannedQty} ${item.uom} of ${item.code}`,
    });

    return newWo;
  }

  /**
   * Release work order for shop floor execution
   */
  static async releaseWorkOrder(idOrCode, user) {
    const wo = await db.collection("work_orders").findOne((o) => o.code === idOrCode || o.id === idOrCode);
    if (!wo) {
      const err = new Error(`Work order ${idOrCode} not found`);
      err.status = 404;
      throw err;
    }

    const updated = await db.collection("work_orders").update(
      (o) => o.id === wo.id,
      { status: "In Progress" }
    );

    return updated;
  }

  /**
   * Record shop floor progress for an operation (Complete units, scrap, auto-advance)
   */
  static async recordOperationProgress(idOrCode, seq, { completedQty, scrapQty = 0, scrapReason, operatorId }, user) {
    const wo = await db.collection("work_orders").findOne((o) => o.code === idOrCode || o.id === idOrCode);
    if (!wo) {
      const err = new Error(`Work order ${idOrCode} not found`);
      err.status = 404;
      throw err;
    }

    const opSeq = Number(seq);
    const cQty = Number(completedQty) || 0;
    const sQty = Number(scrapQty) || 0;

    const op = await db.collection("work_order_operations").findOne(
      (o) => o.workOrderId === wo.code && o.seq === opSeq
    );

    if (!op) {
      const err = new Error(`Operation sequence ${opSeq} not found on work order ${wo.code}`);
      err.status = 404;
      throw err;
    }

    const newCompleted = op.completedQty + cQty;
    const newScrap = op.scrappedQty + sQty;
    const isOpComplete = (newCompleted + newScrap) >= op.plannedQty;

    await db.collection("work_order_operations").update((o) => o.id === op.id, {
      completedQty: newCompleted,
      scrappedQty: newScrap,
      status: isOpComplete ? "Completed" : "In Progress",
      operator: user?.name || operatorId || op.operator || "Operator",
      completedAt: isOpComplete ? new Date().toISOString() : null,
      scrapReason: sQty > 0 ? (scrapReason || "Machining / Porosity Defect") : op.scrapReason,
    });

    // Check next operation
    const allOps = await db.collection("work_order_operations").find((o) => o.workOrderId === wo.code);
    allOps.sort((a, b) => a.seq - b.seq);
    const currentIndex = allOps.findIndex((o) => o.seq === opSeq);
    const nextOp = allOps[currentIndex + 1];

    let newWoStatus = wo.status;
    let nextSeq = wo.currentOpSeq;
    let nextName = wo.currentOpName;

    if (isOpComplete && nextOp) {
      nextSeq = nextOp.seq;
      nextName = nextOp.name;
      await db.collection("work_order_operations").update((o) => o.id === nextOp.id, {
        status: "In Progress",
      });
    } else if (isOpComplete && !nextOp) {
      // Final operation complete! Work order complete!
      newWoStatus = "Completed";
      nextSeq = opSeq;

      // Auto-backflush finished goods into FG-WAREHOUSE
      const fgOnhand = await db.collection("inventory_onhand").findOne(
        (r) => r.itemCode === wo.itemCode && r.subinventory === "FG-WAREHOUSE"
      );
      if (fgOnhand) {
        await db.collection("inventory_onhand").update((r) => r.id === fgOnhand.id, {
          onhandQty: fgOnhand.onhandQty + newCompleted,
          availableQty: fgOnhand.availableQty + newCompleted,
          totalValue: (fgOnhand.onhandQty + newCompleted) * fgOnhand.unitCost,
        });
      }

      // Record transaction
      const txnNumber = `TXN-${Date.now().toString().slice(-6)}`;
      await db.collection("inventory_transactions").insert({
        id: txnNumber,
        txnNumber,
        type: "WIP_COMPLETION",
        itemCode: wo.itemCode,
        itemName: wo.itemName,
        fromSubinventory: "WIP-STAGING",
        toSubinventory: "FG-WAREHOUSE",
        quantity: newCompleted,
        uom: wo.uom,
        reference: wo.code,
        createdBy: user?.name || "System",
        createdAt: new Date().toISOString(),
      });
    }

    // Update WO header metrics
    const updatedWo = await db.collection("work_orders").update(
      (o) => o.id === wo.id,
      {
        completedQty: isOpComplete && !nextOp ? newCompleted : wo.completedQty,
        scrappedQty: wo.scrappedQty + sQty,
        status: newWoStatus,
        currentOpSeq: nextSeq,
        currentOpName: nextName,
        completionPercent: Math.min(100, Math.round((newCompleted / wo.plannedQty) * 100)),
      }
    );

    return {
      message: `Operation ${opSeq} progress updated: +${cQty} completed, +${sQty} scrapped`,
      operation: await db.collection("work_order_operations").findOne((o) => o.id === op.id),
      workOrder: updatedWo,
    };
  }

  /**
   * Run Material Requirements Planning (MRP) engine calculation
   */
  static async runMrpPlanning() {
    const items = await db.collection("items").find();
    const plans = [];

    for (const item of items) {
      const onhandList = await db.collection("inventory_onhand").find((o) => o.itemCode === item.code);
      const totalAvailable = onhandList.reduce((sum, o) => sum + (o.availableQty || 0), 0);

      // Determine active demand from Work Orders
      let demand = 0;
      if (item.category === "Finished Goods") {
        demand = item.reorderPoint || 250;
      } else {
        const issues = await db.collection("material_issues").find((m) => m.itemCode === item.code && m.status !== "Fully Issued");
        demand = issues.reduce((sum, i) => sum + Math.max(0, i.requiredQty - i.issuedQty), 0);
      }

      const safety = item.safetyStock || 0;
      const netShortage = Math.max(0, (demand + safety) - totalAvailable);

      if (netShortage > 0) {
        const suggestedQty = Math.max(netShortage, item.minOrderQty || 50);
        plans.push({
          id: `MRP-${item.code}`,
          itemCode: item.code,
          itemName: item.name,
          category: item.category,
          grossDemand: demand,
          projectedOnhand: totalAvailable,
          safetyStock: safety,
          netShortage,
          uom: item.uom,
          suggestedAction: item.makeOrBuy === "Make" ? "CREATE_WORK_ORDER" : "CREATE_PURCHASE_REQUISITION",
          suggestedQty,
          suggestedDate: new Date(Date.now() + (item.leadTimeDays || 3) * 86400000).toISOString().split("T")[0],
          supplierName: item.makeOrBuy === "Make" ? "In-House Assembly Line" : "Western Auto Forge",
          status: "Recommended",
          firmedRef: null,
        });
      }
    }

    // Save plans to store
    for (const p of plans) {
      const existing = await db.collection("mrp_plans").findOne((e) => e.itemCode === p.itemCode);
      if (existing) {
        await db.collection("mrp_plans").update((e) => e.id === existing.id, p);
      } else {
        await db.collection("mrp_plans").insert(p);
      }
    }

    return db.collection("mrp_plans").find();
  }

  /**
   * Firm planned order into an actual Purchase Requisition or Work Order
   */
  static async firmPlannedOrder(planId, user) {
    const plan = await db.collection("mrp_plans").findOne((p) => p.id === planId || p.itemCode === planId);
    if (!plan) {
      const err = new Error(`MRP Plan ${planId} not found`);
      err.status = 404;
      throw err;
    }

    if (plan.status === "Firmed") {
      const err = new Error(`MRP Plan ${planId} is already firmed (${plan.firmedRef})`);
      err.status = 400;
      throw err;
    }

    let firmedRef = "";
    if (plan.suggestedAction === "CREATE_WORK_ORDER") {
      const wo = await this.createWorkOrder({
        itemCode: plan.itemCode,
        plannedQty: plan.suggestedQty,
        dueDate: plan.suggestedDate,
      }, user);
      firmedRef = wo.code;
    } else {
      // Create Requisition
      const prCode = `PR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.collection("purchase_requisitions").insert({
        id: prCode,
        code: prCode,
        title: `MRP Generated Sourcing for ${plan.itemCode}`,
        department: "Production",
        requesterId: user?.id || "usr-05",
        requesterName: user?.name || "Anil Deshmukh",
        status: "Approved",
        lines: [
          {
            itemCode: plan.itemCode,
            description: plan.itemName,
            quantity: plan.suggestedQty,
            unitPrice: 150.00,
            uom: plan.uom,
          },
        ],
      });
      firmedRef = prCode;
    }

    await db.collection("mrp_plans").update((p) => p.id === plan.id, {
      status: "Firmed",
      firmedRef,
    });

    return {
      message: `Successfully firmed ${plan.suggestedAction} -> ${firmedRef}`,
      firmedRef,
      action: plan.suggestedAction,
    };
  }
}

