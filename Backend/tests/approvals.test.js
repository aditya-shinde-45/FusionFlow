import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Workflow & Approval Engine Tests", () => {
  let plantHeadToken;
  let prodMgrToken;

  before(async () => {
    // Plant Head (approves PR-2026-1184)
    const phLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "plant.head", password: "Demo@123" });
    plantHeadToken = phLogin.body.data.token;

    // Line Manager Production
    const pmLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "mgr.production", password: "Demo@123" });
    prodMgrToken = pmLogin.body.data.token;
  });

  it("should list pending approvals assigned to the current user's role", async () => {
    const res = await request(app)
      .get("/api/v1/approvals")
      .set("Authorization", `Bearer ${plantHeadToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    const prReq = res.body.data.find((a) => a.id === "PR-2026-1184");
    assert.ok(prReq);
  });

  it("should fail rejection if reason/comment is missing", async () => {
    const res = await request(app)
      .post("/api/v1/approvals/PR-2026-1184/action")
      .set("Authorization", `Bearer ${plantHeadToken}`)
      .send({
        action: "Rejected",
        comment: "", // Empty rejection reason
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "REJECTION_REASON_REQUIRED");
  });

  it("should approve a request and update history and status", async () => {
    const res = await request(app)
      .post("/api/v1/approvals/PR-2026-1184/action")
      .set("Authorization", `Bearer ${plantHeadToken}`)
      .send({
        action: "Approved",
        comment: "Capital expenditure approved against manufacturing budget.",
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, "Approved");
    assert.ok(res.body.data.history.some((h) => h.action === "Approved" && h.approver === "Suresh Rane"));
  });

  it("should prevent actions on already finalized approval requests", async () => {
    const res = await request(app)
      .post("/api/v1/approvals/PR-2026-1184/action")
      .set("Authorization", `Bearer ${plantHeadToken}`)
      .send({
        action: "Approved",
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "INVALID_STATUS_TRANSITION");
  });
});

