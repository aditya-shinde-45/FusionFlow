import { ApprovalService } from "../services/approvalService.js";
import { successResponse } from "../utils/response.js";

export class ApprovalController {
  static async list(req, res, next) {
    try {
      const assignedRole = req.query.assignedRole || req.user.role;
      const data = await ApprovalService.listApprovals({ ...req.query, assignedRole });
      return successResponse(res, { data, message: "Approvals worklist retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const data = await ApprovalService.getApprovalById(req.params.id);
      return successResponse(res, { data, message: "Approval request details retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async act(req, res, next) {
    try {
      const data = await ApprovalService.actOnApproval(req.params.id, req.body, req.user);
      return successResponse(res, {
        data,
        message: `Approval request ${req.body.action.toLowerCase()} successfully`,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listRules(req, res, next) {
    try {
      const data = await ApprovalService.listRules();
      return successResponse(res, { data, message: "Approval rules retrieved" });
    } catch (err) {
      next(err);
    }
  }
}

