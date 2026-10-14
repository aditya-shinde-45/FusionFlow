import { db } from "../config/database.js";
import { ApiError } from "../utils/response.js";

export class PayablesService {
  // ==========================================
  // AP Invoices & 3-Way Match Engine
  // ==========================================

  static async listInvoices({ search = "", status = "", supplierId = "" } = {}) {
    const invoices = await db.collection("ap_invoices").find((inv) => {
      if (supplierId && inv.supplierId !== supplierId) return false;
      if (status && status !== "All" && inv.status.toLowerCase() !== status.toLowerCase()) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inv.code.toLowerCase().includes(q) ||
          inv.supplierInvoiceNum.toLowerCase().includes(q) ||
          inv.supplierName.toLowerCase().includes(q)
        );
      }
      return true;
    });
    return invoices;
  }

  static async getInvoiceById(id) {
    const invoice = await db.collection("ap_invoices").findById(id);
    if (!invoice) {
      throw new ApiError(`Invoice ${id} not found`, 404);
    }
    return invoice;
  }

  static async createInvoice(data, currentUser = null) {
    const supplier = await db.collection("suppliers").findById(data.supplierId);
    if (!supplier) {
      throw new ApiError(`Supplier ${data.supplierId} not found`, 404);
    }

    // Check duplicate supplier invoice number
    const duplicate = await db.collection("ap_invoices").findOne(
      (inv) =>
        inv.supplierId === supplier.id &&
        inv.supplierInvoiceNum.toUpperCase() === data.supplierInvoiceNum.toUpperCase()
    );
    if (duplicate) {
      throw new ApiError(
        `Duplicate invoice number: "${data.supplierInvoiceNum}" already exists for ${supplier.name} (${duplicate.code})`,
        409
      );
    }

    const po = await db.collection("purchase_orders").findById(data.poId);
    if (!po) {
      throw new ApiError(`Purchase order ${data.poId} not found`, 404);
    }

    // Fetch related receipts to compute accepted quantities
    const receipts = await db.collection("receipts").find(
      (r) => r.poId === po.id || r.poCode === po.code
    );

    const count = await db.collection("ap_invoices").count();
    const code = `INV-${8840 + count + 1}`;

    const evaluatedLines = [];
    const holds = [];

    // Evaluate each line against PO and Receipts
    const inputLines = data.lines && data.lines.length > 0 ? data.lines : po.lines.map((pl) => ({
      lineNum: pl.lineNum,
      itemCode: pl.itemCode,
      description: pl.description,
      invoicedQty: pl.orderedQty,
      unitPrice: pl.unitPrice,
    }));

    for (const line of inputLines) {
      const poLine = po.lines.find((pl) => pl.itemCode === line.itemCode || pl.lineNum === line.lineNum);
      const poQty = poLine ? poLine.orderedQty : line.invoicedQty;
      const poPrice = poLine ? poLine.unitPrice : line.unitPrice;

      // Calculate accepted quantity across receipts
      let totalAccepted = 0;
      receipts.forEach((r) => {
        const rl = r.lines?.find((l) => l.itemCode === line.itemCode || l.lineNum === line.lineNum);
        if (rl) {
          totalAccepted += rl.acceptedQty || 0;
        }
      });

      const lineTotal = Number((line.invoicedQty * line.unitPrice).toFixed(2));
      const qtyDifference = Math.max(0, line.invoicedQty - totalAccepted);

      let lineMatchStatus = "Matched";
      if (line.invoicedQty > totalAccepted) {
        lineMatchStatus = "On hold";
        const holdId = `HOLD-${code.replace("INV-", "")}-${holds.length + 1}`;
        holds.push({
          holdId,
          code: holdId,
          invoiceId: code,
          invoiceCode: code,
          supplierName: supplier.name,
          holdType: "Quantity variance",
          reason: `Quantity variance: Invoice line ${line.lineNum} (${line.invoicedQty} EA/KG) exceeds accepted receipt (${totalAccepted} EA/KG) by ${qtyDifference} EA/KG`,
          appliedDate: new Date().toISOString().split("T")[0],
          status: "Release requested",
          requestedBy: currentUser?.name || "Nitin Gaikwad",
        });
      } else if (line.unitPrice > poPrice) {
        lineMatchStatus = "On hold";
        const holdId = `HOLD-${code.replace("INV-", "")}-${holds.length + 1}`;
        holds.push({
          holdId,
          code: holdId,
          invoiceId: code,
          invoiceCode: code,
          supplierName: supplier.name,
          holdType: "Price variance",
          reason: `Price variance: Invoiced price ₹ ${line.unitPrice} exceeds PO price ₹ ${poPrice}`,
          appliedDate: new Date().toISOString().split("T")[0],
          status: "Release requested",
          requestedBy: currentUser?.name || "Nitin Gaikwad",
        });
      }

      // Update PO Line billedQty
      if (poLine) {
        poLine.billedQty = (poLine.billedQty || 0) + line.invoicedQty;
      }

      evaluatedLines.push({
        lineNum: line.lineNum,
        itemCode: line.itemCode,
        description: line.description || poLine?.description || "Material line",
        poQty,
        receivedQty: totalAccepted,
        invoicedQty: line.invoicedQty,
        unitPrice: line.unitPrice,
        lineTotal,
        differenceQty: qtyDifference,
        matchStatus: lineMatchStatus,
      });
    }

    await db.collection("purchase_orders").updateById(po.id, { lines: po.lines });

    const hasHolds = holds.length > 0;
    const invoiceStatus = hasHolds ? "On hold" : "Validated";
    const overallMatchStatus = hasHolds ? "On hold" : "Matched";

    const newInvoice = {
      id: code,
      code,
      supplierInvoiceNum: data.supplierInvoiceNum,
      supplierId: supplier.id,
      supplierName: supplier.name,
      poId: po.id,
      poCode: po.code,
      invoiceDate: data.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      invoiceAmount: data.invoiceAmount,
      gstAmount: data.gstAmount || Number((data.invoiceAmount * 0.18).toFixed(2)),
      totalAmount: data.invoiceAmount,
      paymentTerms: data.paymentTerms || supplier.paymentTerms || "Net 30",
      status: invoiceStatus,
      matchStatus: overallMatchStatus,
      lines: evaluatedLines,
      holds,
      createdAt: new Date().toISOString(),
    };

    const savedInvoice = await db.collection("ap_invoices").insert(newInvoice);

    // Save individual hold records and worklist notifications if on hold
    for (const h of holds) {
      await db.collection("ap_holds").insert(h);

      await db.collection("approvals").insert({
        id: h.holdId,
        code: h.holdId,
        entityType: "INVOICE_HOLD",
        title: `Invoice Hold Release ${savedInvoice.code}`,
        amountFormatted: `₹ ${savedInvoice.invoiceAmount.toLocaleString("en-IN")}.00`,
        amount: savedInvoice.invoiceAmount,
        requesterName: currentUser?.name || "Nitin Gaikwad",
        requesterId: currentUser?.id || "EMP-1011",
        department: "Finance and Accounts",
        stage: "Level 1 of 1",
        assignedToRole: "plant.head",
        status: "On hold",
        createdAt: new Date().toISOString(),
        details: { invoiceId: savedInvoice.id, reason: h.reason },
        history: [
          { level: 1, approver: "Suresh Rane", role: "plant.head", action: "On hold", timestamp: new Date().toISOString(), comment: h.reason },
        ],
      });
    }

    return savedInvoice;
  }

  // ==========================================
  // AP Holds
  // ==========================================

  static async listHolds() {
    const holds = await db.collection("ap_holds").find();
    return holds;
  }

  static async releaseHold(holdId, { reason = "Approved by manager" } = {}, currentUser = null) {
    const hold = await db.collection("ap_holds").findById(holdId);
    if (!hold) {
      throw new ApiError(`Hold ${holdId} not found`, 404);
    }

    await db.collection("ap_holds").updateById(holdId, {
      status: "Released",
      releaseReason: reason,
      releasedBy: currentUser?.name || "Suresh Rane",
      releasedAt: new Date().toISOString(),
    });

    // Update invoice holds
    const invoice = await db.collection("ap_invoices").findById(hold.invoiceId || hold.invoiceCode);
    if (invoice) {
      const invHold = invoice.holds?.find((h) => h.holdId === holdId || h.id === holdId);
      if (invHold) {
        invHold.status = "Released";
      }

      // Check if all holds released
      const allReleased = invoice.holds.every((h) => h.status === "Released");
      if (allReleased) {
        invoice.status = "Validated";
        invoice.matchStatus = "Matched";
      }

      await db.collection("ap_invoices").updateById(invoice.id, {
        holds: invoice.holds,
        status: invoice.status,
        matchStatus: invoice.matchStatus,
      });
    }

    // Update worklist item
    await db.collection("approvals").update(
      (a) => a.id === holdId || a.code === holdId,
      { status: "Approved" }
    );

    return { holdId, status: "Released", invoiceStatus: invoice?.status || "Validated" };
  }

  // ==========================================
  // Payment Batches & Disbursements
  // ==========================================

  static async listPaymentBatches() {
    const batches = await db.collection("ap_payment_batches").find();
    return batches;
  }

  static async createPaymentBatch(data, currentUser = null) {
    let targetInvoices = [];

    if (data.invoiceIds && data.invoiceIds.length > 0) {
      for (const id of data.invoiceIds) {
        const inv = await db.collection("ap_invoices").findById(id);
        if (!inv) throw new ApiError(`Invoice ${id} not found`, 404);
        if (inv.status === "On hold") {
          throw new ApiError(`Invoice ${id} is on hold and cannot be selected for payment`, 400);
        }
        if (inv.status === "Paid") {
          throw new ApiError(`Invoice ${id} is already paid`, 400);
        }
        targetInvoices.push(inv);
      }
    } else {
      // Auto-select all validated, unpaid invoices
      targetInvoices = await db.collection("ap_invoices").find(
        (inv) => inv.status === "Validated"
      );
    }

    if (targetInvoices.length === 0) {
      throw new ApiError("No eligible validated invoices available for payment batch", 400);
    }

    const count = await db.collection("ap_payment_batches").count();
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const code = `PAYBATCH-${period}-${String(count + 1).padStart(2, "0")}`;

    const instructions = [];
    let totalAmount = 0;

    for (let i = 0; i < targetInvoices.length; i++) {
      const inv = targetInvoices[i];
      const supplier = await db.collection("suppliers").findById(inv.supplierId);
      const bank = supplier?.bankAccounts?.[0] || {
        accountNumber: "502000109923",
        ifscCode: "HDFC0000486",
      };

      totalAmount += inv.invoiceAmount;

      instructions.push({
        transactionRef: `NEFT-AP-${period}-${String(i + 1).padStart(3, "0")}`,
        beneficiaryName: inv.supplierName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        amount: inv.invoiceAmount,
        currency: "INR",
        paymentDate: data.paymentDate || new Date().toISOString().split("T")[0],
        invoiceRef: inv.code,
      });
    }

    const newBatch = {
      id: code,
      code,
      bankAccount: data.bankAccount || "HDFC Operating · •••• 4821",
      paymentMethod: data.paymentMethod || "NEFT",
      paymentDate: data.paymentDate || new Date().toISOString().split("T")[0],
      totalAmount,
      invoicesCount: targetInvoices.length,
      status: "Approved",
      invoices: targetInvoices.map((inv) => inv.code),
      instructions,
      createdAt: new Date().toISOString(),
    };

    const savedBatch = await db.collection("ap_payment_batches").insert(newBatch);
    return savedBatch;
  }

  static async processPaymentBatch(batchId) {
    const batch = await db.collection("ap_payment_batches").findById(batchId);
    if (!batch) {
      throw new ApiError(`Payment batch ${batchId} not found`, 404);
    }

    batch.status = "Processed";
    batch.processedAt = new Date().toISOString();
    await db.collection("ap_payment_batches").updateById(batchId, batch);

    // Mark invoices as Paid
    for (const invCode of batch.invoices) {
      await db.collection("ap_invoices").update(
        (inv) => inv.code === invCode || inv.id === invCode,
        { status: "Paid", paymentBatchRef: batch.code }
      );
    }

    return batch;
  }

  static async exportBankBatch(batchId) {
    const batch = await db.collection("ap_payment_batches").findById(batchId);
    if (!batch) {
      throw new ApiError(`Payment batch ${batchId} not found`, 404);
    }

    const csvHeaders = "TransactionRef,BeneficiaryName,AccountNumber,IFSCCode,Amount,Currency,PaymentDate,InvoiceRef\n";
    const csvRows = batch.instructions
      .map(
        (ins) =>
          `"${ins.transactionRef}","${ins.beneficiaryName}","${ins.accountNumber}","${ins.ifscCode}",${ins.amount},"${ins.currency}","${ins.paymentDate}","${ins.invoiceRef}"`
      )
      .join("\n");

    return {
      batchId: batch.code,
      fileName: `${batch.code}-NEFT-INSTRUCTIONS.csv`,
      totalAmount: batch.totalAmount,
      recordsCount: batch.instructions.length,
      csvContent: csvHeaders + csvRows,
      instructions: batch.instructions,
    };
  }
}

