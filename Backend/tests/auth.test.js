import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Authentication & Authorization Tests", () => {
  it("should fail login with invalid credentials", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "hr.manager", password: "WrongPassword" });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, "INVALID_CREDENTIALS");
  });

  it("should fail login with missing username or password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "hr.manager" });

    assert.equal(res.status, 422);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, "VALIDATION_ERROR");
  });

  it("should succeed login with valid demo credentials and return JWT + permissions", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "hr.manager", password: "Demo@123" });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.role, "hr.manager");
    assert.ok(Array.isArray(res.body.data.user.permissions));
    assert.ok(res.body.data.user.permissions.includes("employee:create"));
  });

  it("should return 401 when accessing protected route without token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it("should return current user profile with valid Bearer token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "plant.head", password: "Demo@123" });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.data.username, "plant.head");
    assert.equal(meRes.body.data.name, "Suresh Rane");
  });
});

