import { ReceivingService } from "../services/receivingService.js";
import { successResponse } from "../utils/response.js";

export class ReceivingController {
  static async listReceipts(req, res, next) {
    try {
      const receipts = await ReceivingService.listReceipts(req.query);
      return successResponse(res, { data: receipts });
    } catch (err) {
      next(err);
    }
  }

  static async getReceiptById(req, res, next) {
    try {
      const receipt = await ReceivingService.getReceiptById(req.params.id);
      return successResponse(res, { data: receipt });
    } catch (err) {
      next(err);
    }
  }

  static async createReceipt(req, res, next) {
    try {
      const receipt = await ReceivingService.createReceipt(req.body, req.user);
      return successResponse(res, {
        data: receipt,
        message: "Goods Receipt Note (GRN) created and inventory updated",
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listReturns(req, res, next) {
    try {
      const returns = await ReceivingService.listReturns(req.query);
      return successResponse(res, { data: returns });
    } catch (err) {
      next(err);
    }
  }

  static async createReturn(req, res, next) {
    try {
      const rtv = await ReceivingService.createReturn(req.body, req.user);
      return successResponse(res, {
        data: rtv,
        message: "Return to vendor (RTV) and debit note issued",
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  }
}

