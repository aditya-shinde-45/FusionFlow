import { db } from "../config/database.js";
import { ApiError } from "../utils/response.js";

export class ProcurementService {
  // ==========================================
  // Requisitions
  // ==========================================

  static async listRequisitions({ search = "", status = "", department = "" } = {}) {
    const reqs = await db.collection("purchase_requisitions").find((r) => {
      if (department && department !== "All" && r.department !== department) return false;
      if (status && status !== "All" && r.status.toLowerCase() !== status.toLowerCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.code.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.requesterName.toLowerCase().includes(q)
        );
      }
      return true;
    });
    return reqs;
  }

  static async getRequisitionById(id) {
    const req = await db.collection("purchase_requisitions").findById(id);
    if (!req) {
      throw new ApiError(`Purchase requisition ${id} not found`, 404);
    }
    return req;
  }

  static async createRequisition(data, currentUser = null) {
    const count = await db.collection("purchase_requisitions").count();
    const year = new Date().getFullYear();
    const code = `PR-${year}-${1180 + count + 1}`;

    const calculatedLines = data.lines.map((l, index) => {
      const lineTotal = Number((l.quantity * l.unitPrice).toFixed(2));
      return {
        lineNum: index + 1,
        itemCode: l.itemCode,
        description: l.description,
        quantity: l.quantity,
        uom: l.uom || "EA",
        unitPrice: l.unitPrice,
        lineTotal,
        needByDate: l.needByDate || data.needByDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        destination: l.destination || "RM-STORES",
        poConvertedQty: 0,
      };
    });

    const totalAmount = calculatedLines.reduce((sum, l) => sum + l.lineTotal, 0);

    const isHighValue = totalAmount > 200000;
    const approvalChain = isHighValue
      ? [
          { level: 1, role: "mgr.production", name: "Anil Deshmukh", status: "Pending", actionDate: null, comment: null },
          { level: 2, role: "mgr.stores", name: "Kavita More", status: "Pending", actionDate: null, comment: null },
          { level: 3, role: "plant.head", name: "Suresh Rane", status: "Pending", actionDate: null, comment: null },
        ]
      : [
          { level: 1, role: "mgr.stores", name: "Kavita More", status: "Pending", actionDate: null, comment: null },
        ];

    const newReq = {
      id: code,
      code,
      title: data.title,
      businessUnit: data.businessUnit || "Pune Manufacturing",
      department: data.department || "Production",
      departmentId: "dept-01",
      requesterId: currentUser?.id || "EMP-1004",
      requesterName: currentUser?.name || "Anil Deshmukh",
      needByDate: data.needByDate || new Date(Date.now() + 10 * 86400000).toISOString().split("T")[0],
      justification: data.justification || "Production materials requisition.",
      totalAmount,
      currency: "INR",
      status: "Pending approval",
      stage: `Level 1 of ${approvalChain.length}`,
      approvalChain,
      lines: calculatedLines,
      createdAt: new Date().toISOString(),
    };

    const saved = await db.collection("purchase_requisitions").insert(newReq);

    // Auto-create approval worklist item
    await db.collection("approvals").insert({
      id: code,
      code,
      entityType: "PURCHASE_REQUISITION",
      title: `Purchase Requisition ${code}`,
      amountFormatted: `₹ ${totalAmount.toLocaleString("en-IN")}.00`,
      amount: totalAmount,
      requesterName: saved.requesterName,
      requesterId: saved.requesterId,
      department: saved.department,
      stage: saved.stage,
      assignedToRole: approvalChain[0].role,
      status: "Pending approval",
      createdAt: new Date().toISOString(),
      details: { requisitionId: saved.id, linesCount: saved.lines.length },
      history: approvalChain,
    });

    return saved;
  }

  static async approveRequisition(id, currentUser = null) {
    const req = await this.getRequisitionById(id);
    const updated = await db.collection("purchase_requisitions").updateById(id, {
      status: "Approved",
      stage: "Approved",
    });

    // Update approval item in worklist
    await db.collection("approvals").update(
      (a) => a.code === id || a.id === id,
      { status: "Approved" }
    );

    return updated;
  }

  static async convertToPo(requisitionId, poDetails = {}) {
    const req = await this.getRequisitionById(requisitionId);
    if (req.status !== "Approved") {
      throw new ApiError(`Requisition ${requisitionId} must be approved before converting to PO`, 400);
    }

    const supplierId = poDetails.supplierId || "SUP-101";
    const supplier = await db.collection("suppliers").findById(supplierId);

    const count = await db.collection("purchase_orders").count();
    const year = new Date().getFullYear();
    const poCode = `PO-${year}-${840 + count + 1}`;

    const poLines = req.lines.map((l, idx) => ({
      lineNum: idx + 1,
      itemCode: l.itemCode,
      description: l.description,
      orderedQty: l.quantity,
      uom: l.uom,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      receivedQty: 0,
      billedQty: 0,
    }));

    const poSchedules = poLines.map((l, idx) => ({
      lineNum: l.lineNum,
      scheduleNum: 1,
      needByDate: req.needByDate,
      shipTo: "Pune Stores",
      orderedQty: l.orderedQty,
      receivedQty: 0,
      dueQty: l.orderedQty,
    }));

    const newPo = {
      id: poCode,
      code: poCode,
      requisitionId: req.code,
      supplierId: supplier?.id || supplierId,
      supplierName: supplier?.name || "Western Auto Forge",
      supplierSite: poDetails.supplierSite || "PUNE-01",
      buyerId: poDetails.buyerId || "EMP-1009",
      buyerName: "Vikram Jadhav",
      businessUnit: "Pune Manufacturing",
      orderDate: new Date().toISOString().split("T")[0],
      currency: "INR",
      paymentTerms: supplier?.paymentTerms || "Net 30",
      status: "Open",
      totalAmount: req.totalAmount,
      lines: poLines,
      schedules: poSchedules,
      createdAt: new Date().toISOString(),
    };

    const savedPo = await db.collection("purchase_orders").insert(newPo);

    // Update requisition lines converted qty
    req.lines.forEach((l) => (l.poConvertedQty = l.quantity));
    await db.collection("purchase_requisitions").updateById(requisitionId, {
      lines: req.lines,
      status: "Converted to PO",
    });

    return savedPo;
  }

  // ==========================================
  // Purchase Orders
  // ==========================================

  static async listPurchaseOrders({ search = "", status = "", supplierId = "" } = {}) {
    const orders = await db.collection("purchase_orders").find((po) => {
      if (supplierId && po.supplierId !== supplierId) return false;
      if (status && status !== "All" && po.status.toLowerCase() !== status.toLowerCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          po.code.toLowerCase().includes(q) ||
          po.supplierName.toLowerCase().includes(q) ||
          po.buyerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
    return orders;
  }

  static async getPoById(id) {
    const po = await db.collection("purchase_orders").findById(id);
    if (!po) {
      throw new ApiError(`Purchase order ${id} not found`, 404);
    }

    // Attach related receipts and invoices if any
    const receipts = await db.collection("receipts").find((r) => r.poId === po.id || r.poCode === po.code);
    const invoices = await db.collection("ap_invoices").find((i) => i.poId === po.id || i.poCode === po.code);

    return {
      ...po,
      receipts,
      invoices,
    };
  }

  static async createPo(data, currentUser = null) {
    const supplier = await db.collection("suppliers").findById(data.supplierId);
    if (!supplier) {
      throw new ApiError(`Supplier ${data.supplierId} not found`, 404);
    }

    const count = await db.collection("purchase_orders").count();
    const year = new Date().getFullYear();
    const code = `PO-${year}-${840 + count + 1}`;

    const poLines = data.lines.map((l, idx) => {
      const lineTotal = Number((l.orderedQty * l.unitPrice).toFixed(2));
      return {
        lineNum: idx + 1,
        itemCode: l.itemCode,
        description: l.description,
        orderedQty: l.orderedQty,
        uom: l.uom || "EA",
        unitPrice: l.unitPrice,
        lineTotal,
        receivedQty: 0,
        billedQty: 0,
      };
    });

    const totalAmount = poLines.reduce((sum, l) => sum + l.lineTotal, 0);

    const poSchedules = poLines.map((l) => ({
      lineNum: l.lineNum,
      scheduleNum: 1,
      needByDate: l.needByDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      shipTo: "Pune Stores",
      orderedQty: l.orderedQty,
      receivedQty: 0,
      dueQty: l.orderedQty,
    }));

    const newPo = {
      id: code,
      code,
      requisitionId: data.requisitionId || null,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierSite: data.supplierSite || "PUNE-01",
      buyerId: currentUser?.id || "EMP-1009",
      buyerName: currentUser?.name || "Vikram Jadhav",
      businessUnit: data.businessUnit || "Pune Manufacturing",
      orderDate: new Date().toISOString().split("T")[0],
      currency: "INR",
      paymentTerms: data.paymentTerms || supplier.paymentTerms || "Net 30",
      status: "Open",
      totalAmount,
      lines: poLines,
      schedules: poSchedules,
      createdAt: new Date().toISOString(),
    };

    const saved = await db.collection("purchase_orders").insert(newPo);
    return saved;
  }
}

