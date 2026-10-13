import { EmployeeService } from "../services/employeeService.js";
import { successResponse } from "../utils/response.js";

export class EmployeeController {
  static async list(req, res, next) {
    try {
      const result = await EmployeeService.listEmployees(req.query);
      return successResponse(res, {
        data: result.items,
        meta: result.pagination,
        message: "Employees retrieved successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const employee = await EmployeeService.getEmployeeById(req.params.id);
      return successResponse(res, {
        data: employee,
        message: "Employee details retrieved successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const created = await EmployeeService.createEmployee(req.body);
      return successResponse(res, {
        data: created,
        message: "Employee record created successfully",
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const updated = await EmployeeService.updateEmployee(req.params.id, req.body);
      return successResponse(res, {
        data: updated,
        message: "Employee profile updated successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  static async performAction(req, res, next) {
    try {
      const result = await EmployeeService.performEmploymentAction(req.params.id, req.body);
      return successResponse(res, {
        data: result,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getOrgChart(req, res, next) {
    try {
      const tree = await EmployeeService.getOrgChart();
      return successResponse(res, {
        data: tree,
        message: "Organization hierarchy retrieved successfully",
      });
    } catch (err) {
      next(err);
    }
  }
}

