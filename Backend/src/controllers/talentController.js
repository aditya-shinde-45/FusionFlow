import { TalentService } from "../services/talentService.js";
import { successResponse } from "../utils/response.js";

export class TalentController {
  // Review Cycles
  static async listCycles(req, res, next) {
    try {
      const data = await TalentService.listCycles();
      return successResponse(res, { data, message: "Performance review cycles retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async createCycle(req, res, next) {
    try {
      const data = await TalentService.createCycle(req.body);
      return successResponse(res, { data, message: "Review cycle created", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  // Goals
  static async listGoals(req, res, next) {
    try {
      const employeeId = req.query.employeeId || (req.user.role.startsWith("emp.") ? req.user.employeeId : undefined);
      const data = await TalentService.listGoals({ ...req.query, employeeId });
      return successResponse(res, { data, message: "Performance goals retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async createGoal(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const data = await TalentService.createGoal({ ...req.body, employeeId });
      return successResponse(res, { data, message: "Performance goal created", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async updateGoal(req, res, next) {
    try {
      const data = await TalentService.updateGoalProgress(req.params.id, req.body);
      return successResponse(res, { data, message: "Performance goal updated" });
    } catch (err) {
      next(err);
    }
  }

  // Reviews
  static async listReviews(req, res, next) {
    try {
      const employeeId = req.query.employeeId || (req.user.role.startsWith("emp.") ? req.user.employeeId : undefined);
      const data = await TalentService.listReviews({ ...req.query, employeeId });
      return successResponse(res, { data, message: "Performance reviews retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async initiateReview(req, res, next) {
    try {
      const data = await TalentService.initiateReview(req.body);
      return successResponse(res, { data, message: "Performance review initiated", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async submitSelfAssessment(req, res, next) {
    try {
      const data = await TalentService.submitSelfAssessment(req.params.id, req.body);
      return successResponse(res, { data, message: "Self-assessment submitted" });
    } catch (err) {
      next(err);
    }
  }

  static async submitManagerAssessment(req, res, next) {
    try {
      const data = await TalentService.submitManagerAssessment(req.params.id, req.body);
      return successResponse(res, { data, message: "Manager assessment submitted" });
    } catch (err) {
      next(err);
    }
  }

  // Learning & Development
  static async listCourses(req, res, next) {
    try {
      const data = await TalentService.listCourses(req.query);
      return successResponse(res, { data, message: "Course catalog retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async createCourse(req, res, next) {
    try {
      const data = await TalentService.createCourse(req.body);
      return successResponse(res, { data, message: "Course created", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async listEnrollments(req, res, next) {
    try {
      const employeeId = req.query.employeeId || (req.user.role.startsWith("emp.") ? req.user.employeeId : undefined);
      const data = await TalentService.listEnrollments({ ...req.query, employeeId });
      return successResponse(res, { data, message: "Course enrollments retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async enroll(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const data = await TalentService.enrollInCourse({ ...req.body, employeeId });
      return successResponse(res, { data, message: "Enrolled in course successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async completeEnrollment(req, res, next) {
    try {
      const data = await TalentService.completeEnrollment(req.params.id, req.body);
      return successResponse(res, { data, message: "Course completion recorded" });
    } catch (err) {
      next(err);
    }
  }
}

