import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Payroll Management & Statutory Calculations (Workflow B)", () => {
  let hrToken;
  let plantHeadToken;
  let emp1Token;
  let emp2Token;
  let runId;
  let payslipId;

  before(async () => {
    // HR Manager
    const hrLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "hr.manager", password: "Demo@123" });
    hrToken = hrLogin.body.data.token;

    // Plant Head (approver / finalizer)
    const phLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "plant.head", password: "Demo@123" });
    plantHeadToken = phLogin.body.data.token;

    // Employee 1 (Rahul Patil - EMP-1042)
    const emp1Login = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "emp.production", password: "Demo@123" });
    emp1Token = emp1Login.body.data.token;

    // Employee 2 (Sneha Joshi - EMP-1008)
    const emp2Login = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "emp.quality", password: "Demo@123" });
    emp2Token = emp2Login.body.data.token;
  });

  it("should create a new payroll period", async () => {
    const res = await request(app)
      .post("/api/v1/payroll/periods")
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        year: 2026,
        month: 11, // November 2026
        daysInMonth: 30,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.code, "2026-11");
  });

  it("should calculate payroll with Indian statutory rules and decimal safety", async () => {
    const res = await request(app)
      .post("/api/v1/payroll/runs/calculate")
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        periodCode: "2026-11",
        payGroup: "Permanent Plant Staff",
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.run);
    assert.equal(res.body.data.run.periodCode, "2026-11");
    assert.ok(res.body.data.run.totalGross > 0);
    assert.ok(res.body.data.run.totalDeductions > 0);
    assert.ok(res.body.data.run.totalNet > 0);
    assert.equal(res.body.data.run.status, "Calculated");

    runId = res.body.data.run.id;

    // Check specific employee payslip calculations
    const slips = res.body.data.payslips;
    const rahulSlip = slips.find((s) => s.employeeId === "EMP-1042");
    assert.ok(rahulSlip);
    assert.equal(rahulSlip.basic, 28000.0);
    // PF is 12% of 28000 = 3360
    assert.equal(rahulSlip.providentFund, 3360.0);
    // Maharashtra PTax = 200
    assert.equal(rahulSlip.professionalTax, 200.0);
    // Net = Gross - Deductions
    assert.equal(rahulSlip.netPayable, rahulSlip.grossEarnings - rahulSlip.totalDeductions);

    payslipId = rahulSlip.id;
  });

  it("should submit payroll run for Plant Head approval", async () => {
    const res = await request(app)
      .post(`/api/v1/payroll/runs/${runId}/submit`)
      .set("Authorization", `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "Pending approval");
  });

  it("should allow authorized approver (Plant Head) to approve payroll run", async () => {
    const res = await request(app)
      .post(`/api/v1/payroll/runs/${runId}/approve`)
      .set("Authorization", `Bearer ${plantHeadToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "Approved");
  });

  it("should finalize and lock payroll run (idempotent, publishes payslips)", async () => {
    const res = await request(app)
      .post(`/api/v1/payroll/runs/${runId}/finalize`)
      .set("Authorization", `Bearer ${plantHeadToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "Finalized");
    assert.equal(res.body.data.locked, true);
  });

  it("should prevent duplicate processing / modification on a locked payroll run", async () => {
    const res = await request(app)
      .post("/api/v1/payroll/runs/calculate")
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        periodCode: "2026-11",
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "PAYROLL_LOCKED");
  });

  it("should generate NEFT/RTGS bank payment instructions export", async () => {
    const res = await request(app)
      .get(`/api/v1/payroll/runs/${runId}/export-bank`)
      .set("Authorization", `Bearer ${plantHeadToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.batchId);
    assert.ok(Array.isArray(res.body.data.records));
    assert.ok(res.body.data.records.length > 0);
  });

  it("should allow employee to view their own payslip", async () => {
    const res = await request(app)
      .get(`/api/v1/payroll/payslips/${payslipId}`)
      .set("Authorization", `Bearer ${emp1Token}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.employeeId, "EMP-1042");
    assert.equal(res.body.data.status, "Published");
  });

  it("should strictly forbid one employee from viewing another employee's payslip", async () => {
    // emp2 (Sneha Joshi) attempts to access Rahul's payslip
    const res = await request(app)
      .get(`/api/v1/payroll/payslips/${payslipId}`)
      .set("Authorization", `Bearer ${emp2Token}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "UNAUTHORIZED_PAYSLIP_ACCESS");
  });
});

