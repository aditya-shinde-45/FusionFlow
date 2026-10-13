import { RecruitmentService } from "../services/recruitmentService.js";
import { successResponse } from "../utils/response.js";

export class RecruitmentController {
  // Requisitions
  static async listRequisitions(req, res, next) {
    try {
      const data = await RecruitmentService.listRequisitions(req.query);
      return successResponse(res, { data, message: "Job requisitions retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async getRequisitionById(req, res, next) {
    try {
      const data = await RecruitmentService.getRequisitionById(req.params.id);
      return successResponse(res, { data, message: "Job requisition details retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async createRequisition(req, res, next) {
    try {
      const data = await RecruitmentService.createRequisition(req.body);
      return successResponse(res, { data, message: "Job requisition submitted for approval", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  // Candidates
  static async listCandidates(req, res, next) {
    try {
      const data = await RecruitmentService.listCandidates(req.query);
      return successResponse(res, { data, message: "Candidates retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async getCandidateById(req, res, next) {
    try {
      const data = await RecruitmentService.getCandidateById(req.params.id);
      return successResponse(res, { data, message: "Candidate details retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async registerCandidate(req, res, next) {
    try {
      const data = await RecruitmentService.registerCandidate(req.body);
      return successResponse(res, { data, message: "Candidate registered successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  // Interviews
  static async scheduleInterview(req, res, next) {
    try {
      const data = await RecruitmentService.scheduleInterview(req.params.id, req.body);
      return successResponse(res, { data, message: "Interview scheduled successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async submitFeedback(req, res, next) {
    try {
      const data = await RecruitmentService.submitInterviewFeedback(req.params.id, req.body);
      return successResponse(res, { data, message: "Interview feedback recorded" });
    } catch (err) {
      next(err);
    }
  }

  // Offers
  static async createOffer(req, res, next) {
    try {
      const data = await RecruitmentService.createOffer(req.params.id, req.body);
      return successResponse(res, { data, message: "Offer letter generated", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async respondToOffer(req, res, next) {
    try {
      const data = await RecruitmentService.respondToOffer(req.params.id, req.body);
      return successResponse(res, { data, message: "Offer response recorded" });
    } catch (err) {
      next(err);
    }
  }

  // Convert to Employee
  static async convertToEmployee(req, res, next) {
    try {
      const result = await RecruitmentService.convertCandidateToEmployee(req.params.id, req.body);
      return successResponse(res, {
        data: result.employee,
        message: result.message,
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  }
}

