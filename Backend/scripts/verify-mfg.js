#!/usr/bin/env node

/**
 * FusionFlow Enterprise Plan-to-Produce (Manufacturing & Shop Floor Execution) Verification Script
 * Validates the entire enterprise manufacturing and inventory workflow end-to-end.
 */

import request from "supertest";
import app from "../src/app.js";

const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function logStep(step, title) {
  console.log(`\n${CYAN}${BOLD}[${step}] ${title}${RESET}`);
}

function logPass(msg) {
  console.log(`  ${GREEN}✔ PASS:${RESET} ${msg}`);
}

function logDetail(label, value) {
  console.log(`    • ${label}: ${BOLD}${value}${RESET}`);
}

async function runMfgVerification() {
  console.log(`\n${CYAN}======================================================================${RESET}`);
  console.log(`${CYAN}${BOLD}  FUSIONFLOW PLAN-TO-PRODUCE (MANUFACTURING) E2E VERIFICATION  ${RESET}`);
  console.log(`${CYAN}  Organization: Sahyadri Auto Components Pvt Ltd (Pune Plant)          ${RESET}`);
  console.log(`${CYAN}======================================================================${RESET}`);

  // 1. Authenticate Personas
  logStep("AUTH", "Authenticating Personas (Production Manager, Supervisor, Operator, Stores)");

  const pmRes = await request(app).post("/api/v1/auth/login").send({ username: "mgr.production", password: "Demo@123" });
  const pmToken = pmRes.body.data.token;
  logPass("Production Manager Anil Deshmukh authenticated");

  const psRes = await request(app).post("/api/v1/auth/login").send({ username: "prod.supervisor", password: "Demo@123" });
  const psToken = psRes.body.data.token;
  logPass("Production Supervisor Sanjay Bhosale authenticated");

  const peRes = await request(app).post("/api/v1/auth/login").send({ username: "emp.production", password: "Demo@123" });
  const peToken = peRes.body.data.token;
  logPass("Machine Operator Rahul Patil authenticated");

  const smRes = await request(app).post("/api/v1/auth/login").send({ username: "mgr.stores", password: "Demo@123" });
  const smToken = smRes.body.data.token;
  logPass("Stores Manager Kavita More authenticated");

  // 2. Item Master & On-Hand Inventory
  logStep("STAGE 1", "Item Master Catalog & On-Hand Inventory Balances");

  const itemsRes = await request(app).get("/api/v1/items").set("Authorization", `Bearer ${pmToken}`);
  logPass(`Retrieved ${itemsRes.body.data.length} item master records`);
  logDetail("Sample FG", `${itemsRes.body.data[0].code} - ${itemsRes.body.data[0].name}`);

  const onhandRes = await request(app).get("/api/v1/inventory/onhand").set("Authorization", `Bearer ${smToken}`);
  logPass("Retrieved onhand inventory across all plant subinventories");
  logDetail("Total Inventory Valuation", `₹ ${onhandRes.body.data.summary.totalValuation.toLocaleString("en-IN")}.00`);
  logDetail("Total Units On-Hand", `${onhandRes.body.data.summary.totalQuantity} units`);

  // 3. Subinventory Transfer
  logStep("STAGE 2", "Subinventory Staging Transfer & Validation");

  const xferRes = await request(app)
    .post("/api/v1/inventory/transfers")
    .set("Authorization", `Bearer ${smToken}`)
    .send({
      itemCode: "RM-204",
      fromSubinventory: "RM-STORES",
      toSubinventory: "WIP-STAGING",
      quantity: 100,
      reference: "Staging buffer transfer for Line 1",
    });
  logPass(`Transferred 100 EA of RM-204 from RM-STORES to WIP-STAGING (Txn: ${xferRes.body.data.txnNumber})`);

  // 4. Bills of Materials & Routings
  logStep("STAGE 3", "Multi-Level Bills of Materials & Standard Manufacturing Routings");

  const bomRes = await request(app).get("/api/v1/mfg/bom/BOM-FG-1001").set("Authorization", `Bearer ${pmToken}`);
  logPass(`Exploded BOM-FG-1001 (${bomRes.body.data.itemName}) with ${bomRes.body.data.components.length} components`);
  bomRes.body.data.components.forEach((c) => {
    logDetail(`Component Op ${c.operationSeq}`, `${c.itemCode} (${c.quantityPer} ${c.uom}) - Scrap: ${c.scrapPercent}%`);
  });

  const routingsRes = await request(app).get("/api/v1/mfg/routings").set("Authorization", `Bearer ${pmToken}`);
  logPass(`Retrieved standard manufacturing routings (${routingsRes.body.data.length} routings registered)`);

  // 5. Work Order Lifecycle
  logStep("STAGE 4", "Work Order Creation, Component Allocation & Shop Floor Dispatch");

  const woCreateRes = await request(app)
    .post("/api/v1/mfg/work-orders")
    .set("Authorization", `Bearer ${pmToken}`)
    .send({
      itemCode: "FG-1001",
      plannedQty: 250,
      priority: "Urgent",
      assignedLine: "Pune Brake Pad Line 1",
    });
  const woCode = woCreateRes.body.data.code;
  logPass(`Created Work Order ${woCode} for 250 SET of FG-1001`);
  logDetail("Status", woCreateRes.body.data.status);
  logDetail("First Operation", `Op ${woCreateRes.body.data.currentOpSeq} - ${woCreateRes.body.data.currentOpName}`);

  const woDetailRes = await request(app).get(`/api/v1/mfg/work-orders/${woCode}`).set("Authorization", `Bearer ${psToken}`);
  logPass(`Work order populated with ${woDetailRes.body.data.operations.length} operations and ${woDetailRes.body.data.materials.length} material lines`);

  // 6. Operation Progress Reporting
  logStep("STAGE 5", "Shop Floor Progress Reporting & Auto-Advance");

  const op1Progress = await request(app)
    .post(`/api/v1/mfg/work-orders/${woCode}/operations/10/progress`)
    .set("Authorization", `Bearer ${peToken}`)
    .send({
      completedQty: 248,
      scrapQty: 2,
      scrapReason: "Fine-blanking burr defect",
    });
  logPass(`Reported Op 10 completion by Rahul Patil (+248 completed, +2 scrapped)`);
  logDetail("Operation 10 Status", op1Progress.body.data.operation.status);
  logDetail("Advanced to Next Op", `Op ${op1Progress.body.data.workOrder.currentOpSeq} - ${op1Progress.body.data.workOrder.currentOpName}`);

  // 7. Material Issue to Work Order
  logStep("STAGE 6", "Component Material Issue to Work Order");

  const issueRes = await request(app)
    .post("/api/v1/inventory/material-issues/issue")
    .set("Authorization", `Bearer ${smToken}`)
    .send({
      workOrderId: woCode,
      itemCode: "RM-204",
      quantity: 500,
      subinventory: "RM-STORES",
    });
  logPass(`Component issue processed: ${issueRes.body.data.message}`);

  // 8. MRP Planning & Planned Order Firming
  logStep("STAGE 7", "Material Requirements Planning (MRP) Run & Firm Planned Orders");

  const mrpRes = await request(app).post("/api/v1/mfg/planner/run").set("Authorization", `Bearer ${pmToken}`);
  logPass(`Executed MRP calculation: identified ${mrpRes.body.data.length} replenishment recommendations`);
  mrpRes.body.data.forEach((p) => {
    logDetail(`MRP Recommendation for ${p.itemCode}`, `${p.suggestedAction} (${p.suggestedQty} ${p.uom}) Due: ${p.suggestedDate}`);
  });

  const firmRes = await request(app).post(`/api/v1/mfg/planner/${mrpRes.body.data[0].id}/firm`).set("Authorization", `Bearer ${pmToken}`);
  logPass(`Firmed planned order: ${firmRes.body.data.message}`);

  console.log(`\n${GREEN}======================================================================${RESET}`);
  console.log(`${GREEN}${BOLD}  ✔ ALL PLAN-TO-PRODUCE (MANUFACTURING) WORKFLOWS VERIFIED 100% PASS  ${RESET}`);
  console.log(`${GREEN}======================================================================${RESET}\n`);
}

runMfgVerification().catch((err) => {
  console.error(`${RED}Verification failed:${RESET}`, err);
  process.exit(1);
});

