import { OnboardingService } from "../services/onboardingService.js";
import { successResponse } from "../utils/response.js";

export class OnboardingController {
  static async listTasks(req, res, next) {
    try {
      const data = await OnboardingService.listTasks(req.query);
      return successResponse(res, { data, message: "Onboarding tasks retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async createTask(req, res, next) {
    try {
      const data = await OnboardingService.createTask(req.body);
      return successResponse(res, { data, message: "Onboarding task created", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const data = await OnboardingService.updateTask(req.params.id, req.body);
      return successResponse(res, { data, message: "Onboarding task updated" });
    } catch (err) {
      next(err);
    }
  }
}

