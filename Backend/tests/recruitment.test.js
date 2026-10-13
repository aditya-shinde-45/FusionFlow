import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

describe("Recruitment & Onboarding Lifecycle Tests (Workflow A)", () => {
  let hrToken;
  let candidateId;
  let offerId;

  before(async () => {
    const hrLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ username: "hr.manager", password: "Demo@123" });
    hrToken = hrLogin.body.data.token;
  });

  it("should create a job requisition and generate an approval request", async () => {
    const res = await request(app)
      .post("/api/v1/recruitment/requisitions")
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        title: "Senior Heat Treatment Specialist",
        departmentId: "dept-01",
        department: "Production",
        openings: 2,
        salaryRangeMin: 35000,
        salaryRangeMax: 50000,
        description: "Oversee continuous furnace curing and heat quenching operations.",
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.code.startsWith("REQ-"));
    assert.equal(res.body.data.status, "Pending approval");
  });

  it("should register a new candidate application", async () => {
    const res = await request(app)
      .post("/api/v1/recruitment/candidates")
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        requisitionId: "REQ-2026-1184",
        firstName: "Sachin",
        lastName: "Tendulkar",
        email: "sachin.heat@gmail.com",
        phone: "+91 98229 11223",
        skills: ["Heat Treatment", "Metallurgy", "Curing Press"],
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.data.id.startsWith("CAND-"));
    assert.equal(res.body.data.currentStage, "Applied");
    candidateId = res.body.data.id;
  });

  it("should schedule an interview and submit feedback", async () => {
    // Schedule
    const schedRes = await request(app)
      .post(`/api/v1/recruitment/candidates/${candidateId}/interviews`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        interviewerId: "EMP-1004",
        interviewerName: "Anil Deshmukh",
        scheduledAt: "2026-10-18T11:00:00Z",
      });

    assert.equal(schedRes.status, 201);
    const interviewId = schedRes.body.data.id;

    // Submit feedback
    const feedRes = await request(app)
      .post(`/api/v1/recruitment/interviews/${interviewId}/feedback`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        score: 5,
        feedback: "Exceptional metallurgical knowledge and ISO compliance background.",
        recommendation: "Hire",
      });

    assert.equal(feedRes.status, 200);
    assert.equal(feedRes.body.data.status, "Completed");
  });

  it("should extend a job offer and record candidate acceptance", async () => {
    // Create offer
    const offerRes = await request(app)
      .post(`/api/v1/recruitment/candidates/${candidateId}/offers`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        jobTitle: "Senior Heat Treatment Specialist",
        grade: "G4",
        proposedSalary: 48000.0,
        joiningDate: "2026-11-01",
      });

    assert.equal(offerRes.status, 201);
    assert.ok(offerRes.body.data.id.startsWith("OFFER-"));
    offerId = offerRes.body.data.id;

    // Candidate accepts offer
    const respRes = await request(app)
      .post(`/api/v1/recruitment/offers/${offerId}/respond`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({ accepted: true });

    assert.equal(respRes.status, 200);
    assert.equal(respRes.body.data.status, "Accepted");
  });

  it("should convert the accepted candidate to an employee and initialize onboarding checklists", async () => {
    const convertRes = await request(app)
      .post(`/api/v1/recruitment/candidates/${candidateId}/convert-to-employee`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({
        department: "Production",
        grade: "G4",
        managerId: "EMP-1004",
      });

    assert.equal(convertRes.status, 201);
    assert.equal(convertRes.body.data.fullName, "Sachin Tendulkar");
    assert.ok(convertRes.body.data.employeeNumber.startsWith("EMP-"));

    const newEmpId = convertRes.body.data.id;

    // Check that onboarding tasks were created for the employee
    const taskRes = await request(app)
      .get(`/api/v1/onboarding/tasks?employeeId=${newEmpId}`)
      .set("Authorization", `Bearer ${hrToken}`);

    assert.equal(taskRes.status, 200);
    assert.ok(taskRes.body.data.length >= 4);
  });

  it("should prevent duplicate employee creation from the same candidate", async () => {
    const duplicateRes = await request(app)
      .post(`/api/v1/recruitment/candidates/${candidateId}/convert-to-employee`)
      .set("Authorization", `Bearer ${hrToken}`)
      .send({});

    assert.equal(duplicateRes.status, 409);
    assert.equal(duplicateRes.body.code, "ALREADY_CONVERTED");
  });
});

