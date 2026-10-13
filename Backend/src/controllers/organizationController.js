import { OrganizationService } from "../services/organizationService.js";
import { successResponse } from "../utils/response.js";

export class OrganizationController {
  static async listDepartments(req, res, next) {
    try {
      const data = await OrganizationService.listDepartments();
      return successResponse(res, { data, message: "Departments retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async getDepartmentById(req, res, next) {
    try {
      const data = await OrganizationService.getDepartmentById(req.params.id);
      return successResponse(res, { data, message: "Department retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async createDepartment(req, res, next) {
    try {
      const data = await OrganizationService.createDepartment(req.body);
      return successResponse(res, { data, message: "Department created", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async listJobs(req, res, next) {
    try {
      const data = await OrganizationService.listJobs();
      return successResponse(res, { data, message: "Jobs retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async createJob(req, res, next) {
    try {
      const data = await OrganizationService.createJob(req.body);
      return successResponse(res, { data, message: "Job created", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async listPositions(req, res, next) {
    try {
      const data = await OrganizationService.listPositions();
      return successResponse(res, { data, message: "Positions retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async createPosition(req, res, next) {
    try {
      const data = await OrganizationService.createPosition(req.body);
      return successResponse(res, { data, message: "Position created", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async listLocations(req, res, next) {
    try {
      const data = await OrganizationService.listLocations();
      return successResponse(res, { data, message: "Locations retrieved" });
    } catch (err) {
      next(err);
    }
  }
}

