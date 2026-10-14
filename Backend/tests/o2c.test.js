import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Order-to-Cash (O2C - Sales, Shipping, Receivables) Lifecycle Tests", () => {
  let salesOpsToken;
  let storesControllerToken;
  let accountsToken;
  let plantHeadToken;
  let auditorToken;

  let createdSoCode;
  let generatedDelCode;
  let generatedInvCode;

  before(async () => {
    // Sales Operations (Ritu Sharma)
    const soRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "sales.ops", password: "Demo@123" });
    salesOpsToken = soRes.body.data.token;

    // Stores Controller (Pooja Nair)
    const scRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "stores.controller", password: "Demo@123" });
    storesControllerToken = scRes.body.data.token;

    // Accounts Clerk (Nitin Gaikwad)
    const acRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "accounts.clerk", password: "Demo@123" });
    accountsToken = acRes.body.data.token;

    // Plant Head (Suresh Rane)
    const phRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "plant.head", password: "Demo@123" });
    plantHeadToken = phRes.body.data.token;

    // Auditor (Auditor User)
    const audRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "auditor", password: "Demo@123" });
    auditorToken = audRes.body.data.token;
  });

  // ==========================================
  // Stage 1: Customer Master & Price Lists
  // ==========================================

  it("should list approved OEM customers with credit limits", async () => {
    const res = await request(app)
      .get("/api/v1/customers")
      .set("Authorization", `Bearer ${salesOpsToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 3);
    assert.ok(res.body.data.some((c) => c.code === "CUST-101"));
  });

  it("should retrieve single customer details with orders and open invoices", async () => {
    const res = await request(app)
      .get("/api/v1/customers/CUST-101")
      .set("Authorization", `Bearer ${salesOpsToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.code, "CUST-101");
    assert.ok(res.body.data.creditLimit >= 5000000);
  });

  it("should list active commercial price lists", async () => {
    const res = await request(app)
      .get("/api/v1/price-lists")
      .set("Authorization", `Bearer ${salesOpsToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.some((pl) => pl.code === "PL-OEM-2026"));
  });

  // ==========================================
  // Stage 2: Sales Order Booking & Credit Limits
  // ==========================================

  it("should book sales order within credit limit", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${salesOpsToken}`)
      .send({
        customerId: "CUST-101",
        lines: [
          {
            itemCode: "FG-1001",
            description: "Ceramic Disc Brake Pads (Front Axle Set)",
            orderedQty: 100,
            unitPrice: 1250.00,
            uom: "SET",
          },
        ],
      });

    assert.equal(res.status, 201);
    createdSoCode = res.body.data.code;
    assert.ok(createdSoCode.startsWith("SO-2026-"));
    assert.equal(res.body.data.status, "Booked");
    assert.equal(res.body.data.creditCheckStatus, "Passed");
    assert.equal(res.body.data.totalAmount, 125000.00);
    assert.equal(res.body.data.gstAmount, 22500.00);
    assert.equal(res.body.data.grandTotal, 147500.00);
  });

  it("should place order on Credit Hold if order exceeds credit limit", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${salesOpsToken}`)
      .send({
        customerId: "CUST-103", // Limit: 35,00,000, Used: 8,10,000
        lines: [
          {
            itemCode: "FG-1002",
            description: "Heavy Duty Clutch Plate Assembly",
            orderedQty: 2000,
            unitPrice: 3400.00, // Total: 68,00,000 (exceeds limit!)
            uom: "EA",
          },
        ],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, "Credit Hold");
    assert.equal(res.body.data.creditCheckStatus, "Credit Hold");
  });

  // ==========================================
  // Stage 3: Shipping & Delivery Dispatch
  // ==========================================

  it("should ship-confirm order, create delivery, deduct FG inventory, and auto-generate AR invoice", async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${createdSoCode}/ship-confirm`)
      .set("Authorization", `Bearer ${storesControllerToken}`)
      .send({
        carrierName: "VRL Logistics Ltd",
        vehicleNumber: "MH-12-PQ-9912",
        ewayBillNumber: "241088491122",
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.delivery);
    assert.ok(res.body.data.invoice);

    generatedDelCode = res.body.data.delivery.code;
    generatedInvCode = res.body.data.invoice.code;

    assert.equal(res.body.data.delivery.status, "Shipped");
    assert.equal(res.body.data.invoice.status, "Open");
    assert.equal(res.body.data.order.status, "Shipped");
  });

  it("should retrieve shipping delivery note", async () => {
    const res = await request(app)
      .get("/api/v1/shipping")
      .set("Authorization", `Bearer ${storesControllerToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.some((d) => d.code === generatedDelCode));
  });

  // ==========================================
  // Stage 4: Accounts Receivable & Receipts
  // ==========================================

  it("should view generated AR invoice with GST tax breakdown", async () => {
    const res = await request(app)
      .get(`/api/v1/ar/invoices/${generatedInvCode}`)
      .set("Authorization", `Bearer ${accountsToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.code, generatedInvCode);
    assert.equal(res.body.data.totalAmount, 147500.00);
    assert.equal(res.body.data.status, "Open");
  });

  it("should record customer payment receipt and apply against open AR invoice", async () => {
    const res = await request(app)
      .post("/api/v1/ar/receipts")
      .set("Authorization", `Bearer ${accountsToken}`)
      .send({
        customerId: "CUST-101",
        receiptAmount: 147500.00,
        receiptMethod: "NEFT",
        reference: "UTR-HDFC-9941029",
        appliedInvoices: [generatedInvCode],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.receipt.appliedAmount, 147500.00);
    assert.equal(res.body.data.receipt.status, "Applied");

    // Verify invoice is transitioned to Paid
    const invCheck = await request(app)
      .get(`/api/v1/ar/invoices/${generatedInvCode}`)
      .set("Authorization", `Bearer ${accountsToken}`);
    assert.equal(invCheck.body.data.status, "Paid");
    assert.equal(invCheck.body.data.balanceDue, 0.00);
  });
});

