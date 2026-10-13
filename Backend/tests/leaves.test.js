import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Leave & Absence Management Tests (Workflow D)", () => {
  let empToken;
  let leaveId;

  before(async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "emp.production", password: "Demo@123" });
    empToken = loginRes.body.data.token;
  });

  it("should list available leave types and policy quotas", async () => {
    const res = await request(app)
      .get("/api/v1/leaves/types")
      .set("Authorization", `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    const cl = res.body.data.find((lt) => lt.code === "CL");
    assert.ok(cl);
    assert.equal(cl.annualQuota, 12);
  });

  it("should get current employee leave balances", async () => {
    const res = await request(app)
      .get("/api/v1/leaves/balances")
      .set("Authorization", `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.some((b) => b.leaveTypeCode === "CL"));
  });

  it("should apply for leave and move days to pending", async () => {
    const res = await request(app)
      .post("/api/v1/leaves/requests")
      .set("Authorization", `Bearer ${empToken}`)
      .send({
        leaveTypeCode: "CL",
        startDate: "2026-11-10",
        endDate: "2026-11-11", // 2 days
        reason: "Personal commitment in Pune",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.daysCount, 2);
    assert.equal(res.body.data.status, "Pending approval");
    leaveId = res.body.data.id;
  });

  it("should reject an overlapping leave request", async () => {
    const res = await request(app)
      .post("/api/v1/leaves/requests")
      .set("Authorization", `Bearer ${empToken}`)
      .send({
        leaveTypeCode: "SL",
        startDate: "2026-11-11", // overlaps with 2026-11-10 to 2026-11-11
        endDate: "2026-11-12",
        reason: "Overlapping attempt",
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.code, "OVERLAPPING_LEAVE");
  });

  it("should cancel leave request and restore balance", async () => {
    const res = await request(app)
      .post(`/api/v1/leaves/requests/${leaveId}/cancel`)
      .set("Authorization", `Bearer ${empToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "Cancelled");
  });

  it("should reject leave application when balance is insufficient", async () => {
    const res = await request(app)
      .post("/api/v1/leaves/requests")
      .set("Authorization", `Bearer ${empToken}`)
      .send({
        leaveTypeCode: "CL",
        startDate: "2026-12-01",
        endDate: "2026-12-30", // 30 days exceeds remaining CL balance
        reason: "Month off",
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INSUFFICIENT_LEAVE_BALANCE");
  });
});

