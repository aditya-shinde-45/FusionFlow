import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Procure-to-Pay (P2P) Lifecycle Tests", () => {
  let buyerToken;
  let storesMgrToken;
  let plantHeadToken;
  let accountsToken;
  let supplierId;
  let requisitionCode;
  let poCode;
  let receiptCode;
  let invoiceCode;
  let holdId;
  let paymentBatchCode;

  before(async () => {
    // Buyer (Vikram Jadhav)
    const buyerRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "buyer", password: "Demo@123" });
    buyerToken = buyerRes.body.data.token;

    // Line Manager, Stores and Purchase (Kavita More)
    const storesRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "mgr.stores", password: "Demo@123" });
    storesMgrToken = storesRes.body.data.token;

    // Plant Head (Suresh Rane)
    const phRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "plant.head", password: "Demo@123" });
    plantHeadToken = phRes.body.data.token;

    // Accounts Clerk (Nitin Gaikwad)
    const acctRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "accounts.clerk", password: "Demo@123" });
    accountsToken = acctRes.body.data.token;
  });

  // ==========================================
  // Stage 1: Supplier Lifecycle
  // ==========================================

  it("should list approved suppliers with search filter", async () => {
    const res = await request(app)
      .get("/api/v1/suppliers?search=Western")
      .set("Authorization", `Bearer ${buyerToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((s) => s.name === "Western Auto Forge"));
  });

  it("should register a new supplier and generate an approval item", async () => {
    const res = await request(app)
      .post("/api/v1/suppliers")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        name: "Kalyani Springs & Stampings",
        taxId: "27AABCK9918F1Z1",
        category: "Direct Materials",
        primarySite: "PUNE-02",
        address: "Bhosari Sector 10, Pune",
        city: "Pune",
        primaryContact: "Ramesh Kalyani",
        email: "ramesh@kalyanisprings.com",
        phone: "+91 20 2748 9911",
        paymentTerms: "Net 30",
        bankName: "HDFC Bank",
        bankAccount: "502000881920",
        bankIfsc: "HDFC0000486",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.name, "Kalyani Springs & Stampings");
    assert.equal(res.body.data.status, "Pending approval");
    supplierId = res.body.data.id;
  });

  it("should reject duplicate supplier registration with identical GSTIN", async () => {
    const res = await request(app)
      .post("/api/v1/suppliers")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        name: "Duplicate Kalyani Entity",
        taxId: "27AABCK9918F1Z1", // Same GSTIN
        category: "Direct Materials",
      });

    assert.equal(res.status, 409);
    assert.ok(res.body.message.includes("already exists"));
  });

  // ==========================================
  // Stage 2: Purchase Requisitions
  // ==========================================

  it("should create a multi-line purchase requisition and calculate totals", async () => {
    const res = await request(app)
      .post("/api/v1/requisitions")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        title: "Brake Disc Castings for November Batch",
        department: "Production",
        justification: "Critical raw materials for OEM brake assembly orders.",
        needByDate: "2026-11-15",
        lines: [
          {
            itemCode: "RM-301",
            description: "Cast Iron Brake Disc Blank",
            quantity: 400,
            uom: "EA",
            unitPrice: 550.0,
            destination: "RM-STORES",
          },
          {
            itemCode: "RM-302",
            description: "Ceramic Friction Pellets",
            quantity: 150,
            uom: "KG",
            unitPrice: 820.0,
            destination: "RM-STORES",
          },
        ],
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.code.startsWith("PR-"));
    // 400 * 550 = 220000; 150 * 820 = 123000; Total = 343000
    assert.equal(res.body.data.totalAmount, 343000);
    assert.equal(res.body.data.status, "Pending approval");
    requisitionCode = res.body.data.code;
  });

  it("should approve the requisition via manager action", async () => {
    const res = await request(app)
      .post(`/api/v1/requisitions/${requisitionCode}/approve`)
      .set("Authorization", `Bearer ${plantHeadToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "Approved");
  });

  it("should convert the approved requisition into a Purchase Order", async () => {
    const res = await request(app)
      .post(`/api/v1/requisitions/${requisitionCode}/convert-to-po`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        supplierId: "SUP-101",
        supplierSite: "PUNE-01",
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.code.startsWith("PO-"));
    assert.equal(res.body.data.status, "Open");
    assert.equal(res.body.data.lines.length, 2);
    poCode = res.body.data.code;
  });

  // ==========================================
  // Stage 3: Receiving & Tolerance Inspection
  // ==========================================

  it("should enforce over-delivery tolerance limit (+5% max)", async () => {
    // Ordered 400 EA, +5% max is 420 EA. Trying to deliver 480 EA.
    const res = await request(app)
      .post("/api/v1/receiving")
      .set("Authorization", `Bearer ${storesMgrToken}`)
      .send({
        poId: poCode,
        packingSlip: "WAF-PS-TEST",
        lines: [
          {
            lineNum: 1,
            itemCode: "RM-301",
            deliveredQty: 480, // Exceeds tolerance
            acceptedQty: 480,
            rejectedQty: 0,
          },
        ],
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes("over-delivery tolerance"));
  });

  it("should record Goods Receipt Note (GRN) with accepted & rejected inspection quantities", async () => {
    // Deliver 300 EA: 290 Accepted, 10 Rejected due to casting blowholes
    const res = await request(app)
      .post("/api/v1/receiving")
      .set("Authorization", `Bearer ${storesMgrToken}`)
      .send({
        poId: poCode,
        packingSlip: "WAF-PS-8841A",
        lines: [
          {
            lineNum: 1,
            itemCode: "RM-301",
            deliveredQty: 300,
            acceptedQty: 290,
            rejectedQty: 10,
            rejectionReason: "Casting blowholes and surface porosity",
            subinventory: "RM-STORES",
            rejectSubinventory: "QUALITY-HOLD",
          },
        ],
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.code.startsWith("RCV-"));
    assert.equal(res.body.data.lines[0].acceptedQty, 290);
    assert.equal(res.body.data.lines[0].rejectedQty, 10);
    receiptCode = res.body.data.code;
  });

  it("should verify that rejected material generated an RTV debit note", async () => {
    const res = await request(app)
      .get(`/api/v1/receiving/returns?search=${receiptCode}`)
      .set("Authorization", `Bearer ${buyerToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.length >= 1);
    assert.equal(res.body.data[0].returnQty, 10);
    assert.ok(res.body.data[0].debitNoteRef.startsWith("DN-"));
  });

  // ==========================================
  // Stage 4: AP Invoices & 3-Way Match Engine
  // ==========================================

  it("should trigger automated 3-way match quantity variance hold when invoice exceeds receipt", async () => {
    // Invoicing for 300 EA, but only 290 EA were accepted on the receipt
    const res = await request(app)
      .post("/api/v1/ap/invoices")
      .set("Authorization", `Bearer ${accountsToken}`)
      .send({
        supplierId: "SUP-101",
        supplierInvoiceNum: "WAF/INV/2026/099",
        poId: poCode,
        invoiceAmount: 165000.0, // 300 * 550
        lines: [
          {
            lineNum: 1,
            itemCode: "RM-301",
            invoicedQty: 300,
            unitPrice: 550.0,
          },
        ],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, "On hold");
    assert.equal(res.body.data.matchStatus, "On hold");
    assert.equal(res.body.data.holds.length, 1);
    assert.equal(res.body.data.holds[0].holdType, "Quantity variance");
    invoiceCode = res.body.data.code;
    holdId = res.body.data.holds[0].holdId;
  });

  it("should release the invoice matching hold upon managerial justification", async () => {
    const res = await request(app)
      .post(`/api/v1/ap/holds/${holdId}/release`)
      .set("Authorization", `Bearer ${plantHeadToken}`)
      .send({
        reason: "Supplier agreed to issue credit note for 10 EA rejected castings",
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "Released");
    assert.equal(res.body.data.invoiceStatus, "Validated");

    // Verify invoice status updated to Validated
    const invRes = await request(app)
      .get(`/api/v1/ap/invoices/${invoiceCode}`)
      .set("Authorization", `Bearer ${accountsToken}`);

    assert.equal(invRes.body.data.status, "Validated");
    assert.equal(invRes.body.data.matchStatus, "Matched");
  });

  // ==========================================
  // Stage 5: Payment Batches & Disbursements
  // ==========================================

  it("should generate a payment batch for validated invoices", async () => {
    const res = await request(app)
      .post("/api/v1/ap/payments/batches")
      .set("Authorization", `Bearer ${accountsToken}`)
      .send({
        bankAccount: "HDFC Operating · •••• 4821",
        paymentMethod: "NEFT",
        invoiceIds: [invoiceCode],
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.code.startsWith("PAYBATCH-"));
    assert.equal(res.body.data.status, "Approved");
    assert.equal(res.body.data.totalAmount, 165000);
    paymentBatchCode = res.body.data.code;
  });

  it("should export NEFT payment batch file with beneficiary bank details", async () => {
    const res = await request(app)
      .get(`/api/v1/ap/payments/batches/${paymentBatchCode}/export-bank`)
      .set("Authorization", `Bearer ${accountsToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.fileName.endsWith("-NEFT-INSTRUCTIONS.csv"));
    assert.ok(res.body.data.csvContent.includes("Western Auto Forge"));
    assert.ok(res.body.data.csvContent.includes("165000"));
  });

  it("should process the payment batch and transition invoice to Paid status", async () => {
    const res = await request(app)
      .post(`/api/v1/ap/payments/batches/${paymentBatchCode}/process`)
      .set("Authorization", `Bearer ${accountsToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "Processed");

    // Verify invoice is Paid
    const invRes = await request(app)
      .get(`/api/v1/ap/invoices/${invoiceCode}`)
      .set("Authorization", `Bearer ${accountsToken}`);

    assert.equal(invRes.body.data.status, "Paid");
    assert.equal(invRes.body.data.paymentBatchRef, paymentBatchCode);
  });
});

