import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Cross-Module Integration, Reports & Admin Tests", () => {
  let adminToken;
  let hrToken;

  before(async () => {
    const adminLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "admin", password: "Demo@123" });
    adminToken = adminLogin.body.data.token;

    const hrLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "hr.manager", password: "Demo@123" });
    hrToken = hrLogin.body.data.token;
  });

  it("should return service health status with uptime, db, and environment details", async () => {
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.database.status, "healthy");
  });

  it("should generate comprehensive headcount analytics report", async () => {
    const res = await request(app)
      .get("/api/v1/reports/headcount")
      .set("Authorization", `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.activeHeadcount > 0);
    assert.ok(res.body.data.byDepartment.Production > 0);
  });

  it("should generate recruitment funnel report with applicant stages", async () => {
    const res = await request(app)
      .get("/api/v1/reports/recruitment")
      .set("Authorization", `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.totalApplicants > 0);
    assert.ok(res.body.data.stageBreakdown);
  });

  it("should generate payroll cost breakdown by department", async () => {
    const res = await request(app)
      .get("/api/v1/reports/payroll-cost")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.costByDepartment);
  });

  it("should list system user accounts and roles for administrator", async () => {
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 14);
    // Ensure password hashes are never exposed!
    assert.equal(res.body.data.every((u) => u.passwordHash === undefined), true);
  });

  it("should list role permissions matrix", async () => {
    const res = await request(app)
      .get("/api/v1/admin/roles")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.roles));
    assert.ok(res.body.data.matrix.admin);
  });

  it("should retrieve immutable enterprise audit log trail", async () => {
    const res = await request(app)
      .get("/api/v1/admin/audit")
      .set("Authorization", `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
  });
});

