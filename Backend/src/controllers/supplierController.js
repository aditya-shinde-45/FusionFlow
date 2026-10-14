import { SupplierService } from "../services/supplierService.js";
import { successResponse } from "../utils/response.js";

export class SupplierController {
  static async list(req, res, next) {
    try {
      const suppliers = await SupplierService.list(req.query);
      return successResponse(res, { data: suppliers });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const supplier = await SupplierService.getById(req.params.id);
      return successResponse(res, { data: supplier });
    } catch (err) {
      next(err);
    }
  }

  static async create(req, res, next) {
    try {
      const supplier = await SupplierService.create(req.body, req.user);
      return successResponse(res, { data: supplier, message: "Supplier registered successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const supplier = await SupplierService.update(req.params.id, req.body);
      return successResponse(res, { data: supplier, message: "Supplier updated successfully" });
    } catch (err) {
      next(err);
    }
  }
}

