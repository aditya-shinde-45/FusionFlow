import { db } from "../config/database.js";
import { ApiError } from "../utils/response.js";

export class ReceivingService {
  static async listReceipts({ search = "", poId = "", supplierId = "" } = {}) {
    const receipts = await db.collection("receipts").find((r) => {
      if (poId && r.poId !== poId && r.poCode !== poId) return false;
      if (supplierId && r.supplierId !== supplierId) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.code.toLowerCase().includes(q) ||
          r.supplierName.toLowerCase().includes(q) ||
          r.poCode.toLowerCase().includes(q) ||
          (r.packingSlip && r.packingSlip.toLowerCase().includes(q))
        );
      }
      return true;
    });
    return receipts;
  }

  static async getReceiptById(id) {
    const receipt = await db.collection("receipts").findById(id);
    if (!receipt) {
      throw new ApiError(`Receipt ${id} not found`, 404);
    }
    const returns = await db.collection("returns").find((rtv) => rtv.receiptId === receipt.id || rtv.receiptCode === receipt.code);
    return { ...receipt, returns };
  }

  static async createReceipt(data, currentUser = null) {
    const po = await db.collection("purchase_orders").findById(data.poId);
    if (!po) {
      throw new ApiError(`Purchase Order ${data.poId} not found`, 404);
    }

    const count = await db.collection("receipts").count();
    const year = new Date().getFullYear();
    const code = `RCV-${year}-${3820 + count + 1}`;

    const receiptLines = [];

    for (const line of data.lines) {
      const poLine = po.lines.find((pl) => pl.itemCode === line.itemCode || pl.lineNum === line.lineNum);
      if (!poLine) {
        throw new ApiError(`Item ${line.itemCode} does not exist on PO ${po.code}`, 400);
      }

      // Check over-delivery tolerance: +5% max
      const maxAllowed = Math.round(poLine.orderedQty * 1.05);
      const newTotalDelivered = (poLine.receivedQty || 0) + line.deliveredQty;
      if (newTotalDelivered > maxAllowed) {
        throw new ApiError(
          `Delivery quantity (${line.deliveredQty}) exceeds permitted over-delivery tolerance (+5%). Maximum permitted receipt is ${maxAllowed} ${poLine.uom}, current received is ${poLine.receivedQty}`,
          400
        );
      }

      if (line.acceptedQty + line.rejectedQty !== line.deliveredQty) {
        throw new ApiError(
          `Line sum mismatch: Accepted (${line.acceptedQty}) + Rejected (${line.rejectedQty}) must equal Delivered (${line.deliveredQty})`,
          400
        );
      }

      if (line.rejectedQty > 0 && !line.rejectionReason) {
        throw new ApiError(`Rejection reason required for ${line.rejectedQty} rejected ${line.itemCode}`, 400);
      }

      // Update PO Line received quantity
      poLine.receivedQty = (poLine.receivedQty || 0) + line.acceptedQty;

      // Update PO Schedule
      const sched = po.schedules.find((s) => s.lineNum === poLine.lineNum);
      if (sched) {
        sched.receivedQty = (sched.receivedQty || 0) + line.acceptedQty;
        sched.dueQty = Math.max(0, sched.orderedQty - sched.receivedQty);
      }

      receiptLines.push({
        lineNum: line.lineNum || poLine.lineNum,
        itemCode: poLine.itemCode,
        description: poLine.description,
        deliveredQty: line.deliveredQty,
        acceptedQty: line.acceptedQty,
        rejectedQty: line.rejectedQty || 0,
        rejectionReason: line.rejectedQty > 0 ? line.rejectionReason : null,
        subinventory: line.subinventory || "RM-STORES",
        rejectSubinventory: line.rejectedQty > 0 ? (line.rejectSubinventory || "QUALITY-HOLD") : null,
      });
    }

    // Determine PO status
    const allCompleted = po.lines.every((pl) => (pl.receivedQty || 0) >= pl.orderedQty);
    const someReceived = po.lines.some((pl) => (pl.receivedQty || 0) > 0);
    po.status = allCompleted ? "Received" : someReceived ? "Partially Received" : po.status;

    await db.collection("purchase_orders").updateById(po.id, {
      lines: po.lines,
      schedules: po.schedules,
      status: po.status,
    });

    const newReceipt = {
      id: code,
      code,
      poId: po.id,
      poCode: po.code,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      receiptDate: new Date().toISOString().split("T")[0],
      receiverId: currentUser?.id || "EMP-1010",
      receiverName: currentUser?.name || "Pooja Nair",
      packingSlip: data.packingSlip || "PS-AUTO",
      subinventory: data.subinventory || "RM-STORES",
      status: "Completed",
      lines: receiptLines,
      createdAt: new Date().toISOString(),
    };

    const saved = await db.collection("receipts").insert(newReceipt);

    // Auto-create Return to Vendor if any rejected quantities
    for (const rl of receiptLines) {
      if (rl.rejectedQty > 0) {
        await this.createReturn({
          receiptId: saved.id,
          itemCode: rl.itemCode,
          returnQty: rl.rejectedQty,
          reason: rl.rejectionReason,
          uom: "EA",
        });
      }
    }

    return saved;
  }

  // ==========================================
  // Returns to Supplier (RTV)
  // ==========================================

  static async listReturns({ search = "", supplierId = "" } = {}) {
    const returns = await db.collection("returns").find((rtv) => {
      if (supplierId && rtv.supplierId !== supplierId) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          rtv.code.toLowerCase().includes(q) ||
          rtv.supplierName.toLowerCase().includes(q) ||
          rtv.receiptCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
    return returns;
  }

  static async createReturn(data) {
    const receipt = await db.collection("receipts").findById(data.receiptId);
    if (!receipt) {
      throw new ApiError(`Receipt ${data.receiptId} not found`, 404);
    }

    const count = await db.collection("returns").count();
    const year = new Date().getFullYear();
    const code = `RTV-${year}-${410 + count + 1}`;
    const debitNoteRef = `DN-${year}-${18 + count + 1}`;

    const newReturn = {
      id: code,
      code,
      receiptId: receipt.id,
      receiptCode: receipt.code,
      supplierId: receipt.supplierId,
      supplierName: receipt.supplierName,
      itemCode: data.itemCode,
      description: data.description || "Material rejected during receipt inspection",
      returnQty: data.returnQty,
      uom: data.uom || "EA",
      reason: data.reason,
      status: "Dispatched to supplier",
      debitNoteRef,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };

    const saved = await db.collection("returns").insert(newReturn);
    return saved;
  }
}

