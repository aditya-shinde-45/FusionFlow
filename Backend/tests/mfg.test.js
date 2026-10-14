import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Plan-to-Produce (Manufacturing & Shop Floor Execution) Tests", () => {
  let prodMgrToken;
  let prodSupvToken;
  let prodEmpToken;
  let storesMgrToken;
  let plantHeadToken;
  let auditorToken;

  let createdWoCode;

  before(async () => {
    // Production Manager (Anil Deshmukh)
    const pmRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "mgr.production", password: "Demo@123" });
    prodMgrToken = pmRes.body.data.token;

    // Production Supervisor (Sanjay Bhosale)
    const psRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "prod.supervisor", password: "Demo@123" });
    prodSupvToken = psRes.body.data.token;

    // Production Operator (Rahul Patil)
    const peRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "emp.production", password: "Demo@123" });
    prodEmpToken = peRes.body.data.token;

    // Stores Manager (Kavita More)
    const smRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "mgr.stores", password: "Demo@123" });
    storesMgrToken = smRes.body.data.token;

    // Plant Head (Suresh Rane)
    const phRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "plant.head", password: "Demo@123" });
    plantHeadToken = phRes.body.data.token;

    // Auditor (read-only)
    const audRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "auditor", password: "Demo@123" });
    auditorToken = audRes.body.data.token;
  });

  // ==========================================
  // Stage 1: Item Master & Inventory
  // ==========================================

  it("should list items from item master with category filters", async () => {
    const res = await request(app)
      .get("/api/v1/items?category=Finished Goods")
      .set("Authorization", `Bearer ${prodMgrToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 2);
    assert.ok(res.body.data.some((i) => i.code === "FG-1001"));
  });

  it("should retrieve single item with onhand breakdown, BOM and routing linkage", async () => {
    const res = await request(app)
      .get("/api/v1/items/FG-1001")
      .set("Authorization", `Bearer ${prodMgrToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.code, "FG-1001");
    assert.ok(res.body.data.totalOnhand >= 450);
    assert.ok(res.body.data.bom);
    assert.ok(res.body.data.routing);
  });

  it("should retrieve onhand inventory balances with valuation summary", async () => {
    const res = await request(app)
      .get("/api/v1/inventory/onhand")
      .set("Authorization", `Bearer ${storesMgrToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.records.length > 0);
    assert.ok(res.body.data.summary.totalValuation > 500000);
  });

  it("should perform subinventory transfer from RM-STORES to WIP-STAGING", async () => {
    const res = await request(app)
      .post("/api/v1/inventory/transfers")
      .set("Authorization", `Bearer ${storesMgrToken}`)
      .send({
        itemCode: "RM-204",
        fromSubinventory: "RM-STORES",
        toSubinventory: "WIP-STAGING",
        quantity: 50,
        reference: "Line 1 Staging Replenishment",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.itemCode, "RM-204");
    assert.equal(res.body.data.type, "SUBINVENTORY_TRANSFER");
  });

  it("should reject subinventory transfer exceeding available stock", async () => {
    const res = await request(app)
      .post("/api/v1/inventory/transfers")
      .set("Authorization", `Bearer ${storesMgrToken}`)
      .send({
        itemCode: "RM-204",
        fromSubinventory: "RM-STORES",
        toSubinventory: "WIP-STAGING",
        quantity: 999999, // Exceeds available
      });

    assert.equal(res.status, 400);
    assert.match(res.body.message || res.body.error, /Insufficient stock/i);
  });

  // ==========================================
  // Stage 2: Bills of Materials & Routings
  // ==========================================

  it("should list active Bills of Materials", async () => {
    const res = await request(app)
      .get("/api/v1/mfg/bom")
      .set("Authorization", `Bearer ${prodMgrToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.some((b) => b.code === "BOM-FG-1001"));
  });

  it("should view detailed BOM explosion with components and scrap %", async () => {
    const res = await request(app)
      .get("/api/v1/mfg/bom/BOM-FG-1001")
      .set("Authorization", `Bearer ${prodMgrToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.itemCode, "FG-1001");
    assert.ok(res.body.data.components.length >= 4);
    assert.ok(res.body.data.components.some((c) => c.itemCode === "RM-204"));
  });

  it("should list standard manufacturing routings and work centers", async () => {
    const routingsRes = await request(app)
      .get("/api/v1/mfg/routings")
      .set("Authorization", `Bearer ${prodMgrToken}`);

    assert.equal(routingsRes.status, 200);
    assert.ok(routingsRes.body.data.some((r) => r.code === "ROUT-FG-1001"));

    const wcRes = await request(app)
      .get("/api/v1/mfg/work-centers")
      .set("Authorization", `Bearer ${prodMgrToken}`);

    assert.equal(wcRes.status, 200);
    assert.ok(wcRes.body.data.some((wc) => wc.code === "WC-STAMP"));
  });

  // ==========================================
  // Stage 3: Work Order Lifecycle & Execution
  // ==========================================

  it("should create and release a new work order with automatic routing and BOM expansion", async () => {
    const res = await request(app)
      .post("/api/v1/mfg/work-orders")
      .set("Authorization", `Bearer ${prodMgrToken}`)
      .send({
        itemCode: "FG-1001",
        plannedQty: 100,
        priority: "Urgent",
        assignedLine: "Pune Brake Pad Line 1",
      });

    assert.equal(res.status, 201);
    createdWoCode = res.body.data.code;
    assert.ok(createdWoCode.startsWith("WO-2026-"));
    assert.equal(res.body.data.status, "Released");
    assert.equal(res.body.data.plannedQty, 100);
  });

  it("should view work order details with generated operations and material pick list", async () => {
    const res = await request(app)
      .get(`/api/v1/mfg/work-orders/${createdWoCode}`)
      .set("Authorization", `Bearer ${prodSupvToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.code, createdWoCode);
    assert.ok(res.body.data.operations.length >= 5);
    assert.ok(res.body.data.materials.length >= 4);
  });

  it("should allow operator to report completed and scrapped units on an operation", async () => {
    const res = await request(app)
      .post(`/api/v1/mfg/work-orders/${createdWoCode}/operations/10/progress`)
      .set("Authorization", `Bearer ${prodEmpToken}`)
      .send({
        completedQty: 98,
        scrapQty: 2,
        scrapReason: "Fine-blanking burr defect",
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.operation.completedQty, 98);
    assert.equal(res.body.data.operation.scrappedQty, 2);
    assert.equal(res.body.data.operation.status, "Completed");
    // Should auto-advance to operation 20
    assert.equal(res.body.data.workOrder.currentOpSeq, 20);
  });

  // ==========================================
  // Stage 4: MRP Planning & Firming
  // ==========================================

  it("should execute Material Requirements Planning (MRP) engine calculation", async () => {
    const res = await request(app)
      .post("/api/v1/mfg/planner/run")
      .set("Authorization", `Bearer ${prodMgrToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data.some((p) => p.suggestedAction === "CREATE_PURCHASE_REQUISITION" || p.suggestedAction === "CREATE_WORK_ORDER"));
  });

  it("should firm a planned order into an actual requisition or work order", async () => {
    const mrpList = await request(app)
      .get("/api/v1/mfg/planner")
      .set("Authorization", `Bearer ${prodMgrToken}`);

    const targetPlan = mrpList.body.data[0];
    assert.ok(targetPlan);

    const res = await request(app)
      .post(`/api/v1/mfg/planner/${targetPlan.id}/firm`)
      .set("Authorization", `Bearer ${prodMgrToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.firmedRef);
  });
});
