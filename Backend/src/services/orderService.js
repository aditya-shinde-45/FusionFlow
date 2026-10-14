import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";
import { logger } from "../utils/logger.js";

export class OrderService {
  /**
   * List customers with search and category filters
   */
  static async listCustomers({ search, category } = {}) {
    let customers = await db.collection("customers").find();

    if (category && category !== "All") {
      customers = customers.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      customers = customers.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.taxId.toLowerCase().includes(q)
      );
    }

    return customers;
  }

  /**
   * Get customer details by code or ID
   */
  static async getCustomer(idOrCode) {
    const customer = await db.collection("customers").findOne(
      (c) => c.id === idOrCode || c.code === idOrCode
    );
    if (!customer) {
      const err = new Error(`Customer ${idOrCode} not found`);
      err.status = 404;
      throw err;
    }

    // Attach open orders and unpaid invoices
    const orders = await db.collection("sales_orders").find((o) => o.customerId === customer.code);
    const invoices = await db.collection("ar_invoices").find((i) => i.customerId === customer.code);

    return {
      ...customer,
      orders,
      invoices,
    };
  }

  /**
   * Create new customer master profile
   */
  static async createCustomer(data, user) {
    if (!data.name || !data.taxId) {
      const err = new Error("Customer name and GSTIN are required");
      err.status = 400;
      throw err;
    }

    const code = data.code || `CUST-${Math.floor(100 + Math.random() * 900)}`;
    const newCustomer = await db.collection("customers").insert({
      id: code,
      code,
      name: data.name,
      taxId: data.taxId,
      pan: data.pan || data.taxId.substring(2, 12),
      category: data.category || "OEM Tier 1",
      primarySite: data.primarySite || "PUNE-PLANT",
      address: data.address || "Pune Industrial Zone",
      paymentTerms: data.paymentTerms || "Net 30",
      creditLimit: Number(data.creditLimit) || 2500000.0,
      creditUsed: 0.0,
      creditHold: false,
      contactPerson: data.contactPerson || "Commercial Lead",
      contactEmail: data.contactEmail || "orders@customer.in",
      contactPhone: data.contactPhone || "+91 98220 00000",
      status: "Active",
      rating: 4.8,
      createdBy: user?.name || "System",
    });

    await db.collection("audit_logs").insert({
      timestamp: new Date().toISOString(),
      userId: user?.id || "sys",
      userName: user?.name || "System",
      role: user?.role || "sales.ops",
      action: "CUSTOMER_CREATE",
      entityType: "CUSTOMER",
      entityId: code,
      details: `Created customer master ${code} - ${newCustomer.name}`,
    });

    return newCustomer;
  }

  /**
   * List price lists
   */
  static async listPriceLists() {
    return db.collection("price_lists").find();
  }

  /**
   * List sales orders with status and search filters
   */
  static async listSalesOrders({ search, status, customerId } = {}) {
    let orders = await db.collection("sales_orders").find();

    if (status && status !== "All") {
      orders = orders.filter((o) => o.status.toLowerCase() === status.toLowerCase());
    }

    if (customerId) {
      orders = orders.filter((o) => o.customerId === customerId);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      );
    }

    return orders;
  }

  /**
   * Get single sales order details
   */
  static async getSalesOrder(idOrCode) {
    const order = await db.collection("sales_orders").findOne(
      (o) => o.id === idOrCode || o.code === idOrCode
    );
    if (!order) {
      const err = new Error(`Sales Order ${idOrCode} not found`);
      err.status = 404;
      throw err;
    }

    // Attach shipping delivery if exists
    const delivery = await db.collection("shipping_deliveries").findOne((d) => d.soCode === order.code);
    // Attach AR invoice if exists
    const invoice = await db.collection("ar_invoices").findOne((i) => i.soCode === order.code);

    return {
      ...order,
      delivery,
      invoice,
    };
  }

  /**
   * Create and book a new sales order with automated credit limit checking
   */
  static async createSalesOrder(data, user) {
    if (!data.customerId || !Array.isArray(data.lines) || data.lines.length === 0) {
      const err = new Error("Customer ID and order lines are required");
      err.status = 400;
      throw err;
    }

    const customer = await db.collection("customers").findOne((c) => c.code === data.customerId || c.id === data.customerId);
    if (!customer) {
      const err = new Error(`Customer ${data.customerId} not found`);
      err.status = 404;
      throw err;
    }

    // Calculate line amounts
    let subtotal = 0;
    const lines = data.lines.map((l, index) => {
      const qty = Number(l.orderedQty || l.quantity) || 1;
      const price = Number(l.unitPrice) || 1000;
      const lineAmt = qty * price;
      subtotal += lineAmt;
      return {
        lineNumber: index + 1,
        itemCode: l.itemCode,
        description: l.description || l.itemCode,
        orderedQty: qty,
        shippedQty: 0,
        uom: l.uom || "EA",
        unitPrice: price,
        lineAmount: lineAmt,
      };
    });

    const gstAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const grandTotal = subtotal + gstAmount;

    // Automated Credit Check
    const projectedCredit = customer.creditUsed + grandTotal;
    const isExceeded = projectedCredit > customer.creditLimit;
    const creditCheckStatus = isExceeded ? "Credit Hold" : "Passed";

    const soCode = `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = await db.collection("sales_orders").insert({
      id: soCode,
      code: soCode,
      customerId: customer.code,
      customerName: customer.name,
      orderDate: new Date().toISOString().split("T")[0],
      requestedShipDate: data.requestedShipDate || new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      priceListCode: data.priceListCode || "PL-OEM-2026",
      shipToSite: data.shipToSite || customer.primarySite,
      totalAmount: subtotal,
      gstAmount,
      grandTotal,
      creditCheckStatus,
      status: isExceeded ? "Credit Hold" : "Booked",
      paymentTerms: customer.paymentTerms,
      createdBy: user?.name || "Ritu Sharma",
      lines,
    });

    // Update customer credit used if not on hold
    if (!isExceeded) {
      await db.collection("customers").update((c) => c.id === customer.id, {
        creditUsed: projectedCredit,
      });
    }

    await db.collection("audit_logs").insert({
      timestamp: new Date().toISOString(),
      userId: user?.id || "sys",
      userName: user?.name || "System",
      role: user?.role || "sales.ops",
      action: "SALES_ORDER_CREATE",
      entityType: "SALES_ORDER",
      entityId: soCode,
      details: `Created sales order ${soCode} for ${customer.name} (Amount: ₹ ${grandTotal}, Credit Check: ${creditCheckStatus})`,
    });

    return newOrder;
  }

  /**
   * Ship Confirm Sales Order (Creates Delivery, deducts inventory, auto-generates AR Invoice)
   */
  static async shipConfirmOrder({ soCode, carrierName, vehicleNumber, ewayBillNumber, lrNumber }, user) {
    const order = await db.collection("sales_orders").findOne((o) => o.code === soCode || o.id === soCode);
    if (!order) {
      const err = new Error(`Sales Order ${soCode} not found`);
      err.status = 404;
      throw err;
    }

    if (["Shipped", "Closed"].includes(order.status)) {
      const err = new Error(`Sales order ${soCode} is already ${order.status}`);
      err.status = 400;
      throw err;
    }

    if (order.status === "Credit Hold") {
      const err = new Error(`Sales order ${soCode} is on Credit Hold. Release hold before shipping`);
      err.status = 400;
      throw err;
    }

    // 1. Deduct finished goods stock from FG-WAREHOUSE
    for (const line of order.lines) {
      const fgStock = await db.collection("inventory_onhand").findOne(
        (o) => o.itemCode === line.itemCode && o.subinventory === "FG-WAREHOUSE"
      );
      if (fgStock && fgStock.availableQty >= line.orderedQty) {
        await db.collection("inventory_onhand").update((o) => o.id === fgStock.id, {
          onhandQty: fgStock.onhandQty - line.orderedQty,
          availableQty: fgStock.availableQty - line.orderedQty,
          totalValue: (fgStock.onhandQty - line.orderedQty) * fgStock.unitCost,
        });
      }

      // Record dispatch transaction
      const txnNumber = `TXN-${Date.now().toString().slice(-6)}`;
      await db.collection("inventory_transactions").insert({
        id: txnNumber,
        txnNumber,
        type: "SHIP_DISPATCH",
        itemCode: line.itemCode,
        itemName: line.description,
        fromSubinventory: "FG-WAREHOUSE",
        toSubinventory: null,
        quantity: line.orderedQty,
        uom: line.uom,
        reference: `Shipment for ${order.code} (${order.customerName})`,
        createdBy: user?.name || "System",
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Create Shipping Delivery Document
    const delCode = `DEL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const delivery = await db.collection("shipping_deliveries").insert({
      id: delCode,
      code: delCode,
      soCode: order.code,
      customerId: order.customerId,
      customerName: order.customerName,
      deliveryDate: new Date().toISOString().split("T")[0],
      carrierName: carrierName || "VRL Logistics Ltd",
      vehicleNumber: vehicleNumber || "MH-12-RN-4821",
      ewayBillNumber: ewayBillNumber || `241088${Math.floor(100000 + Math.random() * 900000)}`,
      lrNumber: lrNumber || `LR-VRL-${Math.floor(10000 + Math.random() * 90000)}`,
      shipTo: order.shipToSite,
      itemsCount: order.lines.length,
      totalQty: order.lines.reduce((sum, l) => sum + l.orderedQty, 0),
      status: "Shipped",
      shippedBy: user?.name || "Pooja Nair",
      createdAt: new Date().toISOString(),
    });

    // 3. Auto-generate AR Tax Invoice
    const isInterstate = order.customerId.startsWith("33") || order.shipToSite.includes("HOSUR");
    const cgst = isInterstate ? 0 : Math.round(order.totalAmount * 0.09 * 100) / 100;
    const sgst = isInterstate ? 0 : Math.round(order.totalAmount * 0.09 * 100) / 100;
    const igst = isInterstate ? Math.round(order.totalAmount * 0.18 * 100) / 100 : 0;

    const invCode = `AR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = await db.collection("ar_invoices").insert({
      id: invCode,
      code: invCode,
      soCode: order.code,
      deliveryCode: delCode,
      customerId: order.customerId,
      customerName: order.customerName,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      taxableAmount: order.totalAmount,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalAmount: order.grandTotal,
      paidAmount: 0.0,
      balanceDue: order.grandTotal,
      status: "Open",
      paymentTerms: order.paymentTerms,
      createdAt: new Date().toISOString(),
    });

    // 4. Update Sales Order status to Shipped
    const updatedOrder = await db.collection("sales_orders").update((o) => o.id === order.id, {
      status: "Shipped",
      lines: order.lines.map((l) => ({ ...l, shippedQty: l.orderedQty })),
    });

    await db.collection("audit_logs").insert({
      timestamp: new Date().toISOString(),
      userId: user?.id || "sys",
      userName: user?.name || "System",
      role: user?.role || "stores.controller",
      action: "SHIP_CONFIRM",
      entityType: "DELIVERY",
      entityId: delCode,
      details: `Ship confirmed order ${order.code} -> Generated Delivery ${delCode} and AR Invoice ${invCode}`,
    });

    return {
      message: `Order ${order.code} successfully ship-confirmed`,
      delivery,
      invoice,
      order: updatedOrder,
    };
  }

  /**
   * List shipping deliveries
   */
  static async listDeliveries() {
    return db.collection("shipping_deliveries").find();
  }

  /**
   * List AR Invoices
   */
  static async listArInvoices({ status, customerId } = {}) {
    let invoices = await db.collection("ar_invoices").find();

    if (status && status !== "All") {
      invoices = invoices.filter((i) => i.status.toLowerCase() === status.toLowerCase());
    }

    if (customerId) {
      invoices = invoices.filter((i) => i.customerId === customerId);
    }

    return invoices;
  }

  /**
   * Get single AR Invoice
   */
  static async getArInvoice(idOrCode) {
    const invoice = await db.collection("ar_invoices").findOne(
      (i) => i.id === idOrCode || i.code === idOrCode
    );
    if (!invoice) {
      const err = new Error(`AR Invoice ${idOrCode} not found`);
      err.status = 404;
      throw err;
    }
    return invoice;
  }

  /**
   * Record AR Customer Payment Receipt and apply against open invoices
   */
  static async createArReceipt({ customerId, receiptAmount, receiptMethod = "NEFT", reference, appliedInvoices = [] }, user) {
    const amount = Number(receiptAmount);
    if (!customerId || amount <= 0) {
      const err = new Error("Customer ID and positive receipt amount are required");
      err.status = 400;
      throw err;
    }

    const customer = await db.collection("customers").findOne((c) => c.code === customerId || c.id === customerId);
    if (!customer) {
      const err = new Error(`Customer ${customerId} not found`);
      err.status = 404;
      throw err;
    }

    let appliedTotal = 0;
    const appliedRecords = [];

    // Apply to selected invoices or oldest open invoice
    let remaining = amount;
    const targetInvoices = appliedInvoices.length > 0
      ? await db.collection("ar_invoices").find((i) => appliedInvoices.includes(i.code))
      : await db.collection("ar_invoices").find((i) => i.customerId === customer.code && i.balanceDue > 0);

    for (const inv of targetInvoices) {
      if (remaining <= 0) break;
      const applyAmt = Math.min(remaining, inv.balanceDue);
      const newPaid = inv.paidAmount + applyAmt;
      const newBal = inv.balanceDue - applyAmt;

      await db.collection("ar_invoices").update((i) => i.id === inv.id, {
        paidAmount: newPaid,
        balanceDue: newBal,
        status: newBal <= 0 ? "Paid" : "Partially Paid",
      });

      appliedRecords.push({ invoiceCode: inv.code, amountApplied: applyAmt });
      appliedTotal += applyAmt;
      remaining -= applyAmt;
    }

    // Release customer credit used
    const newCreditUsed = Math.max(0, customer.creditUsed - amount);
    await db.collection("customers").update((c) => c.id === customer.id, {
      creditUsed: newCreditUsed,
      creditHold: newCreditUsed > customer.creditLimit,
    });

    const recCode = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const receipt = await db.collection("ar_receipts").insert({
      id: recCode,
      code: recCode,
      customerId: customer.code,
      customerName: customer.name,
      receiptDate: new Date().toISOString().split("T")[0],
      receiptMethod,
      reference: reference || `CMS-${receiptMethod}-${Date.now().toString().slice(-5)}`,
      receiptAmount: amount,
      appliedAmount: appliedTotal,
      unappliedAmount: remaining,
      bankAccount: "HDFC Operating · •••• 4821",
      appliedInvoices: appliedRecords,
      status: remaining === 0 ? "Applied" : "Partially Applied",
      recordedBy: user?.name || "Nitin Gaikwad",
      createdAt: new Date().toISOString(),
    });

    await db.collection("audit_logs").insert({
      timestamp: new Date().toISOString(),
      userId: user?.id || "sys",
      userName: user?.name || "System",
      role: user?.role || "accounts.clerk",
      action: "AR_RECEIPT_CREATE",
      entityType: "RECEIPT",
      entityId: recCode,
      details: `Recorded receipt ${recCode} of ₹ ${amount} for ${customer.name} (Applied: ₹ ${appliedTotal}, Released Credit: ₹ ${amount})`,
    });

    return {
      message: `Payment receipt ${recCode} of ₹ ${amount} recorded and applied`,
      receipt,
      customerCreditAvailable: customer.creditLimit - newCreditUsed,
    };
  }

  /**
   * List AR Receipts
   */
  static async listArReceipts() {
    return db.collection("ar_receipts").find();
  }
}

