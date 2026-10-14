import { InventoryService } from "../services/inventoryService.js";
import { sendSuccess, sendCreated, sendError } from "../utils/response.js";

export class InventoryController {
  static async listItems(req, res, next) {
    try {
      const items = await InventoryService.listItems(req.query);
      return sendSuccess(res, items, "Items retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async getItem(req, res, next) {
    try {
      const item = await InventoryService.getItem(req.params.id);
      return sendSuccess(res, item, "Item details retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async createItem(req, res, next) {
    try {
      const item = await InventoryService.createItem(req.body, req.user);
      return sendCreated(res, item, "Item master record created");
    } catch (err) {
      next(err);
    }
  }

  static async getOnhand(req, res, next) {
    try {
      const result = await InventoryService.getOnhand(req.query);
      return sendSuccess(res, result, "On-hand inventory balances retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async getSubinventories(req, res, next) {
    try {
      const subinventories = await InventoryService.getSubinventories();
      return sendSuccess(res, subinventories, "Subinventories retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async getTransactions(req, res, next) {
    try {
      const txns = await InventoryService.getTransactions(req.query);
      return sendSuccess(res, txns, "Inventory transactions retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async transfer(req, res, next) {
    try {
      const txn = await InventoryService.transferSubinventory(req.body, req.user);
      return sendCreated(res, txn, "Subinventory transfer completed");
    } catch (err) {
      next(err);
    }
  }

  static async miscellaneous(req, res, next) {
    try {
      const txn = await InventoryService.recordMiscellaneous(req.body, req.user);
      return sendCreated(res, txn, "Miscellaneous transaction processed");
    } catch (err) {
      next(err);
    }
  }

  static async getCycleCounts(req, res, next) {
    try {
      const counts = await InventoryService.getCycleCounts();
      return sendSuccess(res, counts, "Cycle counts retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async getMaterialIssues(req, res, next) {
    try {
      const issues = await InventoryService.getMaterialIssues(req.query.workOrderId);
      return sendSuccess(res, issues, "Material issues retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async issueMaterial(req, res, next) {
    try {
      const result = await InventoryService.issueMaterial(req.body, req.user);
      return sendSuccess(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }
}

