import { MfgService } from "../services/mfgService.js";
import { sendSuccess, sendCreated, sendError } from "../utils/response.js";

export class MfgController {
  static async listBoms(req, res, next) {
    try {
      const boms = await MfgService.listBoms(req.query);
      return sendSuccess(res, boms, "Bills of Materials retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async getBom(req, res, next) {
    try {
      const bom = await MfgService.getBom(req.params.id);
      return sendSuccess(res, bom, "BOM details retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async createBom(req, res, next) {
    try {
      const bom = await MfgService.createBom(req.body, req.user);
      return sendCreated(res, bom, "Bill of Materials created");
    } catch (err) {
      next(err);
    }
  }

  static async listRoutings(req, res, next) {
    try {
      const routings = await MfgService.listRoutings();
      return sendSuccess(res, routings, "Manufacturing routings retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async getRouting(req, res, next) {
    try {
      const routing = await MfgService.getRouting(req.params.id);
      return sendSuccess(res, routing, "Routing details retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async listWorkCenters(req, res, next) {
    try {
      const workCenters = await MfgService.listWorkCenters();
      return sendSuccess(res, workCenters, "Work centers retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async listWorkOrders(req, res, next) {
    try {
      const orders = await MfgService.listWorkOrders(req.query);
      return sendSuccess(res, orders, "Work orders retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async getWorkOrder(req, res, next) {
    try {
      const order = await MfgService.getWorkOrder(req.params.id);
      return sendSuccess(res, order, "Work order details retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async createWorkOrder(req, res, next) {
    try {
      const order = await MfgService.createWorkOrder(req.body, req.user);
      return sendCreated(res, order, "Work order created and released");
    } catch (err) {
      next(err);
    }
  }

  static async releaseWorkOrder(req, res, next) {
    try {
      const order = await MfgService.releaseWorkOrder(req.params.id, req.user);
      return sendSuccess(res, order, "Work order released to shop floor");
    } catch (err) {
      next(err);
    }
  }

  static async recordOperation(req, res, next) {
    try {
      const result = await MfgService.recordOperationProgress(
        req.params.id,
        req.params.seq,
        req.body,
        req.user
      );
      return sendSuccess(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async runMrp(req, res, next) {
    try {
      const plans = await MfgService.runMrpPlanning();
      return sendSuccess(res, plans, "MRP calculation executed successfully");
    } catch (err) {
      next(err);
    }
  }

  static async firmPlan(req, res, next) {
    try {
      const result = await MfgService.firmPlannedOrder(req.params.id, req.user);
      return sendSuccess(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }
}

