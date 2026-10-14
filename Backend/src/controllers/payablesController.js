import { PayablesService } from "../services/payablesService.js";
import { successResponse } from "../utils/response.js";

export class PayablesController {
  // Invoices
  static async listInvoices(req, res, next) {
    try {
      const invoices = await PayablesService.listInvoices(req.query);
      return successResponse(res, { data: invoices });
    } catch (err) {
      next(err);
    }
  }

  static async getInvoiceById(req, res, next) {
    try {
      const invoice = await PayablesService.getInvoiceById(req.params.id);
      return successResponse(res, { data: invoice });
    } catch (err) {
      next(err);
    }
  }

  static async createInvoice(req, res, next) {
    try {
      const invoice = await PayablesService.createInvoice(req.body, req.user);
      return successResponse(res, {
        data: invoice,
        message: invoice.status === "On hold"
          ? "Invoice saved and matching hold applied"
          : "Invoice validated and matched successfully",
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  }

  // Holds
  static async listHolds(req, res, next) {
    try {
      const holds = await PayablesService.listHolds();
      return successResponse(res, { data: holds });
    } catch (err) {
      next(err);
    }
  }

  static async releaseHold(req, res, next) {
    try {
      const result = await PayablesService.releaseHold(req.params.id, req.body, req.user);
      return successResponse(res, { data: result, message: "Hold released successfully" });
    } catch (err) {
      next(err);
    }
  }

  // Payment Batches
  static async listPaymentBatches(req, res, next) {
    try {
      const batches = await PayablesService.listPaymentBatches();
      return successResponse(res, { data: batches });
    } catch (err) {
      next(err);
    }
  }

  static async createPaymentBatch(req, res, next) {
    try {
      const batch = await PayablesService.createPaymentBatch(req.body, req.user);
      return successResponse(res, {
        data: batch,
        message: "Payment batch generated for approved invoices",
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  }

  static async processPaymentBatch(req, res, next) {
    try {
      const batch = await PayablesService.processPaymentBatch(req.params.id);
      return successResponse(res, { data: batch, message: "Payment batch processed and invoices paid" });
    } catch (err) {
      next(err);
    }
  }

  static async exportBankBatch(req, res, next) {
    try {
      const exportData = await PayablesService.exportBankBatch(req.params.id);
      return successResponse(res, { data: exportData });
    } catch (err) {
      next(err);
    }
  }
}

