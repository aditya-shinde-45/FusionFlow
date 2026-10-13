import { CompensationService } from "../services/compensationService.js";
import { successResponse } from "../utils/response.js";

export class CompensationController {
  static async getByEmployeeId(req, res, next) {
    try {
      const employeeId = req.params.employeeId || req.user.employeeId;
      const data = await CompensationService.getEmployeeCompensation(employeeId);
      return successResponse(res, { data, message: "Compensation records retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async submitRevision(req, res, next) {
    try {
      const data = await CompensationService.submitSalaryRevision(req.body);
      return successResponse(res, { data, message: "Salary revision submitted for approval", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }
}

