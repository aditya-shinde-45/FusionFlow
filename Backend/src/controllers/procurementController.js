import { ProcurementService } from "../services/procurementService.js";
import { successResponse } from "../utils/response.js";

export class ProcurementController {
  // Requisitions
  static async listRequisitions(req, res, next) {
    try {
      const requisitions = await ProcurementService.listRequisitions(req.query);
      return successResponse(res, { data: requisitions });
    } catch (err) {
      next(err);
    }
  }

  static async getRequisitionById(req, res, next) {
    try {
      const requisition = await ProcurementService.getRequisitionById(req.params.id);
      return successResponse(res, { data: requisition });
    } catch (err) {
      next(err);
    }
  }

  static async createRequisition(req, res, next) {
    try {
      const requisition = await ProcurementService.createRequisition(req.body, req.user);
      return successResponse(res, { data: requisition, message: "Purchase requisition created and routed for approval", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async approveRequisition(req, res, next) {
    try {
      const requisition = await ProcurementService.approveRequisition(req.params.id, req.user);
      return successResponse(res, { data: requisition, message: "Purchase requisition approved" });
    } catch (err) {
      next(err);
    }
  }

  static async convertToPo(req, res, next) {
    try {
      const po = await ProcurementService.convertToPo(req.params.id, req.body);
      return successResponse(res, { data: po, message: "Purchase order created from approved requisition", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  // Purchase Orders
  static async listPurchaseOrders(req, res, next) {
    try {
      const orders = await ProcurementService.listPurchaseOrders(req.query);
      return successResponse(res, { data: orders });
    } catch (err) {
      next(err);
    }
  }

  static async getPoById(req, res, next) {
    try {
      const po = await ProcurementService.getPoById(req.params.id);
      return successResponse(res, { data: po });
    } catch (err) {
      next(err);
    }
  }

  static async createPo(req, res, next) {
    try {
      const po = await ProcurementService.createPo(req.body, req.user);
      return successResponse(res, { data: po, message: "Purchase order created successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }
}

