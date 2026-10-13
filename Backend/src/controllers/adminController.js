import { AdminService } from "../services/adminService.js";
import { successResponse } from "../utils/response.js";

export class AdminController {
  static async listUsers(req, res, next) {
    try {
      const data = await AdminService.listUsers();
      return successResponse(res, { data, message: "System users retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async updateUserRole(req, res, next) {
    try {
      const data = await AdminService.updateUserRole(req.params.id, req.body.role);
      return successResponse(res, { data, message: "User role updated successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async listRoles(req, res, next) {
    try {
      const data = await AdminService.listRolesAndPermissions();
      return successResponse(res, { data, message: "Roles and permissions retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async listAudit(req, res, next) {
    try {
      const data = await AdminService.listAuditLogs(req.query);
      return successResponse(res, { data, message: "Audit logs retrieved" });
    } catch (err) {
      next(err);
    }
  }
}

