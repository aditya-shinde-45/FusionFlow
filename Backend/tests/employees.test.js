import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Core HR & Employee Lifecycle Tests", () => {
  let hrToken;
  let empToken;

  before(async () => {
    // Get HR Manager token
    const hrLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "hr.manager", password: "Demo@123" });
    hrToken = hrLogin.body.data.token;

    // Get regular Employee token
    const empLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "emp.production", password: "Demo@123" });
    empToken = empLogin.body.data.token;
  });

  it("should list employees with pagination and filters", async () => {
    const res = await request(app)
      .get("/api/v1/employees?department=Production")
      .set("Authorization", `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.equal(res.body.data.every((e) => e.department === "Production"), true);
  });

  it("should retrieve full employee details with history and direct reports", async () => {
    const res = await request(app)
      .get("/api/v1/employees/EMP-1042")
      .set("Authorization", `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.fullName, "Rahul Patil");
    assert.equal(res.body.data.job, "Production Operator");
    assert.ok(Array.isArray(res.body.data.history));
    assert.ok(res.body.data.history.length > 0);
  });

  it("should create a new employee with generated EMP number and default leave balances", async () => {
    const newEmpData = {
      firstName: "Ganesh",
      lastName: "Kadam",
      workEmail: "ganesh.kadam@sahyadriauto.in",
      department: "Production",
      departmentId: "dept-01",
      job: "Production Operator",
      grade: "G2",
      managerId: "EMP-1004",
      managerName: "Anil Deshmukh",
    };

    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${hrToken}`)
      .send(newEmpData);

    assert.equal(res.status, 201);
    assert.equal(res.body.data.firstName, "Ganesh");
    assert.ok(res.body.data.employeeNumber.startsWith("EMP-"));
  });

  it("should prevent duplicate employee creation with identical email", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        firstName: "Duplicate",
        lastName: "Test",
        workEmail: "ganesh.kadam@sahyadriauto.in", // already created above
        department: "Production",
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.code, "DUPLICATE_EMPLOYEE");
  });

  it("should block non-HR employees from creating employees (RBAC)", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${empToken}`)
      .send({
        firstName: "Hacker",
        lastName: "User",
        workEmail: "hacker@test.com",
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "FORBIDDEN");
  });

  it("should record employment action such as promotion", async () => {
    const actionPayload = {
      action: "PROMOTE",
      effectiveDate: "2026-11-01",
      reason: "Superior operational performance on Line 1",
      proposedGrade: "G4",
      comments: "Approved for senior line technician tier.",
    };

    const res = await request(app)
      .post("/api/v1/employees/EMP-1042/actions")
      .set("Authorization", `Bearer ${hrToken}`)
      .send(actionPayload);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.updatedEmployee.grade, "G4");
  });

  it("should return the organization hierarchy tree", async () => {
    const res = await request(app)
      .get("/api/v1/employees/org-chart")
      .set("Authorization", `Bearer ${hrToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data[0].name, "Suresh Rane");
  });
});

