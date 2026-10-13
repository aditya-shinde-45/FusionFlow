import { db } from "../config/database.js";
import { generateCode, generateUUID } from "../utils/idGenerator.js";
import { EmployeeService } from "./employeeService.js";

export class RecruitmentService {
  // Requisitions
  static async listRequisitions({ status, departmentId }) {
    return db.collection("job_requisitions").find((r) => {
      if (status && r.status.toLowerCase() !== status.toLowerCase()) return false;
      if (departmentId && r.departmentId !== departmentId) return false;
      return true;
    });
  }

  static async getRequisitionById(id) {
    const req = await db.collection("job_requisitions").findOne((r) => r.id === id || r.code === id);
    if (!req) {
      throw { statusCode: 404, code: "REQUISITION_NOT_FOUND", message: `Requisition not found: ${id}` };
    }
    const candidates = await db.collection("candidates").find((c) => c.requisitionId === req.id || c.requisitionId === req.code);
    return { ...req, candidates };
  }

  static async createRequisition(data) {
    const code = generateCode("REQ");
    const requisition = {
      id: code,
      code,
      title: data.title,
      departmentId: data.departmentId,
      department: data.department || "Production",
      jobId: data.jobId || "job-07",
      openings: data.openings || 1,
      hiringManagerId: data.hiringManagerId,
      hiringManager: data.hiringManager || "Line Manager",
      status: "Pending approval",
      minExpYears: data.minExpYears || 1,
      salaryRangeMin: data.salaryRangeMin || 25000,
      salaryRangeMax: data.salaryRangeMax || 40000,
      description: data.description || "",
      createdAt: new Date().toISOString(),
    };

    const created = await db.collection("job_requisitions").insert(requisition);

    // Create approval workflow request
    await db.collection("approval_requests").insert({
      id: code,
      code,
      entityType: "REQUISITION",
      title: `Job Requisition ${code}: ${requisition.title}`,
      amountFormatted: `₹ ${requisition.salaryRangeMax.toLocaleString("en-IN")}.00 Max CTC`,
      amount: requisition.salaryRangeMax,
      requesterName: requisition.hiringManager,
      requesterId: requisition.hiringManagerId,
      department: requisition.department,
      stage: "Level 1 of 2",
      assignedToRole: "hr.manager",
      status: "Pending approval",
      createdAt: new Date().toISOString(),
      history: [
        { level: 1, approver: "Rohini Sawant", role: "hr.manager", action: "Pending", timestamp: null, comment: null },
      ],
    });

    return created;
  }

  // Candidates & Applications
  static async listCandidates({ requisitionId, stage }) {
    return db.collection("candidates").find((c) => {
      if (requisitionId && c.requisitionId !== requisitionId) return false;
      if (stage && c.currentStage.toLowerCase() !== stage.toLowerCase()) return false;
      return true;
    });
  }

  static async getCandidateById(id) {
    const candidate = await db.collection("candidates").findOne((c) => c.id === id);
    if (!candidate) {
      throw { statusCode: 404, code: "CANDIDATE_NOT_FOUND", message: `Candidate not found: ${id}` };
    }
    const interviews = await db.collection("interviews").find((i) => i.candidateId === candidate.id);
    const offer = await db.collection("job_offers").findOne((o) => o.candidateId === candidate.id);
    return { ...candidate, interviews, offer: offer || null };
  }

  static async registerCandidate(data) {
    const id = generateCode("CAND");
    const candidate = {
      id,
      requisitionId: data.requisitionId,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      currentStage: "Applied",
      status: "In progress",
      rating: 0,
      skills: data.skills || [],
      appliedDate: new Date().toISOString().split("T")[0],
      convertedEmployeeId: null,
    };
    return db.collection("candidates").insert(candidate);
  }

  // Interviews
  static async scheduleInterview(candidateId, data) {
    const candidate = await db.collection("candidates").findById(candidateId);
    if (!candidate) {
      throw { statusCode: 404, code: "CANDIDATE_NOT_FOUND", message: "Candidate not found" };
    }

    const interview = {
      id: generateUUID(),
      candidateId,
      interviewerId: data.interviewerId,
      interviewerName: data.interviewerName || "Interviewer",
      scheduledAt: data.scheduledAt,
      status: "Scheduled",
      score: null,
      feedback: null,
      recommendation: null,
    };

    await db.collection("candidates").updateById(candidateId, { currentStage: "Interview" });
    return db.collection("interviews").insert(interview);
  }

  static async submitInterviewFeedback(interviewId, { score, feedback, recommendation }) {
    const interview = await db.collection("interviews").findById(interviewId);
    if (!interview) {
      throw { statusCode: 404, code: "INTERVIEW_NOT_FOUND", message: "Interview record not found" };
    }

    const updated = await db.collection("interviews").updateById(interviewId, {
      score,
      feedback,
      recommendation,
      status: "Completed",
    });

    if (recommendation === "Hire") {
      await db.collection("candidates").updateById(interview.candidateId, {
        rating: score,
        currentStage: "Selected",
      });
    } else if (recommendation === "Reject") {
      await db.collection("candidates").updateById(interview.candidateId, {
        rating: score,
        currentStage: "Rejected",
        status: "Rejected",
      });
    }

    return updated;
  }

  // Job Offers
  static async createOffer(candidateId, data) {
    const candidate = await db.collection("candidates").findById(candidateId);
    if (!candidate) {
      throw { statusCode: 404, code: "CANDIDATE_NOT_FOUND", message: "Candidate not found" };
    }

    const offerId = generateCode("OFFER");
    const offer = {
      id: offerId,
      candidateId,
      candidateName: candidate.fullName,
      candidateEmail: candidate.email,
      requisitionId: candidate.requisitionId,
      jobTitle: data.jobTitle,
      grade: data.grade || "G2",
      proposedSalary: data.proposedSalary,
      joiningDate: data.joiningDate,
      status: "Issued",
      issuedAt: new Date().toISOString(),
      acceptedAt: null,
    };

    await db.collection("candidates").updateById(candidateId, { currentStage: "Offered" });
    return db.collection("job_offers").insert(offer);
  }

  static async respondToOffer(offerId, { accepted, reason }) {
    const offer = await db.collection("job_offers").findById(offerId);
    if (!offer) {
      throw { statusCode: 404, code: "OFFER_NOT_FOUND", message: "Offer not found" };
    }

    const newStatus = accepted ? "Accepted" : "Rejected";
    const updated = await db.collection("job_offers").updateById(offerId, {
      status: newStatus,
      acceptedAt: accepted ? new Date().toISOString() : null,
      rejectionReason: !accepted ? reason : null,
    });

    await db.collection("candidates").updateById(offer.candidateId, {
      status: accepted ? "Offer Accepted" : "Offer Rejected",
      currentStage: accepted ? "Offer Accepted" : "Rejected",
    });

    return updated;
  }

  // Convert Candidate to Employee (Workflow A: Hire to Onboard)
  static async convertCandidateToEmployee(candidateId, employeePayload = {}) {
    const candidate = await db.collection("candidates").findById(candidateId);
    if (!candidate) {
      throw { statusCode: 404, code: "CANDIDATE_NOT_FOUND", message: "Candidate not found" };
    }

    // Safety rule: Prevent duplicate conversion
    if (candidate.convertedEmployeeId) {
      throw {
        statusCode: 409,
        code: "ALREADY_CONVERTED",
        message: `Candidate has already been converted to employee: ${candidate.convertedEmployeeId}`,
      };
    }

    // Verify candidate is offered and accepted
    const offer = await db.collection("job_offers").findOne((o) => o.candidateId === candidate.id && o.status === "Accepted");
    if (!offer && candidate.status !== "Offer Accepted") {
      throw {
        statusCode: 400,
        code: "OFFER_NOT_ACCEPTED",
        message: "Candidate must have an accepted offer before converting to employee",
      };
    }

    // Check for duplicate employee record by email
    const duplicateEmail = await db.collection("employees").findOne((e) => e.workEmail.toLowerCase() === candidate.email.toLowerCase());
    if (duplicateEmail) {
      throw {
        statusCode: 409,
        code: "DUPLICATE_EMPLOYEE",
        message: `An employee already exists with email ${candidate.email}`,
      };
    }

    // Requisition details for department & job
    const req = await db.collection("job_requisitions").findById(candidate.requisitionId);

    // Create employee record
    const newEmployee = await EmployeeService.createEmployee({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      workEmail: candidate.email,
      phone: candidate.phone,
      hireDate: offer?.joiningDate || new Date().toISOString().split("T")[0],
      department: req?.department || employeePayload.department || "Production",
      departmentId: req?.departmentId || employeePayload.departmentId || "dept-01",
      job: offer?.jobTitle || req?.title || employeePayload.job || "Production Operator",
      grade: offer?.grade || employeePayload.grade || "G2",
      managerId: employeePayload.managerId || req?.hiringManagerId || "EMP-1004",
      managerName: employeePayload.managerName || req?.hiringManager || "Anil Deshmukh",
      ...employeePayload,
    });

    // Create standard onboarding tasks for the converted employee
    const tasks = [
      { taskName: "Submit Identity & Address Proof (Aadhaar & PAN)", category: "Documentation", required: true },
      { taskName: "Bank Account & PF Form 11 Submission", category: "Finance", required: true },
      { taskName: "Plant Safety Induction & PPE Equipment Issue", category: "Operations", required: true },
      { taskName: "IT Access & Company ID Badge Issue", category: "IT", required: true },
    ];

    for (const t of tasks) {
      await db.collection("onboarding_tasks").insert({
        id: generateUUID(),
        employeeId: newEmployee.id,
        taskName: t.taskName,
        category: t.category,
        required: t.required,
        completed: false,
        verifiedBy: null,
      });
    }

    // Set initial compensation record if offer has proposedSalary
    if (offer?.proposedSalary) {
      const basic = Math.round(offer.proposedSalary * 0.5);
      const hra = Math.round(offer.proposedSalary * 0.2);
      const special = offer.proposedSalary - basic - hra;
      await db.collection("compensation_records").insert({
        id: `comp-${newEmployee.id}`,
        employeeId: newEmployee.id,
        effectiveDate: newEmployee.hireDate,
        basicSalary: basic,
        hra,
        specialAllowance: special,
        grossSalary: offer.proposedSalary,
        pfEligible: true,
        esiEligible: offer.proposedSalary <= 21000,
        status: "Active",
      });
    }

    // Mark candidate as converted
    await db.collection("candidates").updateById(candidateId, {
      currentStage: "Hired",
      status: "Hired",
      convertedEmployeeId: newEmployee.id,
    });

    return {
      message: "Candidate converted to employee successfully",
      employee: newEmployee,
    };
  }
}

