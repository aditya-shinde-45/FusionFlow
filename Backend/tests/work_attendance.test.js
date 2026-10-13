import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Work Management & Attendance Tests", () => {
  let qualityEmpToken;

  before(async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "emp.quality", password: "Demo@123" });
    qualityEmpToken = loginRes.body.data.token;
  });

  it("should record employee clock-in", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/clock-in")
      .set("Authorization", `Bearer ${qualityEmpToken}`)
      .send({
        shiftId: "shf-02",
        checkInTime: "06:00",
        notes: "Morning shift start",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.employeeId, "EMP-1008");
    assert.equal(res.body.data.status, "Present");
  });

  it("should reject duplicate clock-in on the same day", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/clock-in")
      .set("Authorization", `Bearer ${qualityEmpToken}`)
      .send({
        shiftId: "shf-02",
        checkInTime: "06:10",
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "ALREADY_CLOCKED_IN");
  });

  it("should record clock-out and calculate hours worked & overtime", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/clock-out")
      .set("Authorization", `Bearer ${qualityEmpToken}`)
      .send({
        checkOutTime: "15:30", // 06:00 to 15:30 is 9.5 hours
        notes: "Completed shift with OT",
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.hoursWorked, 9.5);
    assert.equal(res.body.data.overtimeHours, 1.5);
  });

  it("should submit an attendance correction request", async () => {
    const res = await request(app)
      .post("/api/v1/attendance/correction")
      .set("Authorization", `Bearer ${qualityEmpToken}`)
      .send({
        date: "2026-10-12",
        requestedCheckIn: "06:00",
        requestedCheckOut: "14:30",
        reason: "Biometric terminal reader was offline at Gate 2",
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, "Pending approval");
  });

  it("should retrieve monthly attendance summary with hours and overtime", async () => {
    const res = await request(app)
      .get("/api/v1/attendance/summary?year=2026&month=10")
      .set("Authorization", `Bearer ${qualityEmpToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.totalHoursWorked > 0);
  });
});
