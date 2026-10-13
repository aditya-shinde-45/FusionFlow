import { LeaveService } from "../services/leaveService.js";
import { successResponse } from "../utils/response.js";

export class LeaveController {
  static async listTypes(req, res, next) {
    try {
      const data = await LeaveService.listLeaveTypes();
      return successResponse(res, { data, message: "Leave types retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async getBalances(req, res, next) {
    try {
      const employeeId = req.params.employeeId || req.user.employeeId;
      const data = await LeaveService.getLeaveBalances(employeeId);
      return successResponse(res, { data, message: "Leave balances retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async listRequests(req, res, next) {
    try {
      const employeeId = req.query.employeeId || (req.user.role === "emp.production" ? req.user.employeeId : undefined);
      const data = await LeaveService.listLeaveRequests({ ...req.query, employeeId });
      return successResponse(res, { data, message: "Leave requests retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async apply(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const data = await LeaveService.applyLeave({ ...req.body, employeeId });
      return successResponse(res, { data, message: "Leave request submitted for approval", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async cancel(req, res, next) {
    try {
      const employeeId = req.user.employeeId;
      const data = await LeaveService.cancelLeave(req.params.id, employeeId);
      return successResponse(res, { data, message: "Leave request cancelled" });
    } catch (err) {
      next(err);
    }
  }
}

