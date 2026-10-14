import { OrderService } from "../services/orderService.js";
import { sendSuccess, sendCreated } from "../utils/response.js";

export class OrderController {
  // Customers
  static async listCustomers(req, res, next) {
    try {
      const customers = await OrderService.listCustomers(req.query);
      return sendSuccess(res, customers, "Customers retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  static async getCustomer(req, res, next) {
    try {
      const customer = await OrderService.getCustomer(req.params.id);
      return sendSuccess(res, customer, "Customer details retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async createCustomer(req, res, next) {
    try {
      const customer = await OrderService.createCustomer(req.body, req.user);
      return sendCreated(res, customer, "Customer profile created");
    } catch (err) {
      next(err);
    }
  }

  // Price Lists
  static async listPriceLists(req, res, next) {
    try {
      const priceLists = await OrderService.listPriceLists();
      return sendSuccess(res, priceLists, "Price lists retrieved");
    } catch (err) {
      next(err);
    }
  }

  // Sales Orders
  static async listOrders(req, res, next) {
    try {
      const orders = await OrderService.listSalesOrders(req.query);
      return sendSuccess(res, orders, "Sales orders retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async getOrder(req, res, next) {
    try {
      const order = await OrderService.getSalesOrder(req.params.id);
      return sendSuccess(res, order, "Sales order details retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async createOrder(req, res, next) {
    try {
      const order = await OrderService.createSalesOrder(req.body, req.user);
      return sendCreated(res, order, "Sales order created and evaluated against credit limit");
    } catch (err) {
      next(err);
    }
  }

  // Shipping & Dispatch
  static async shipConfirm(req, res, next) {
    try {
      const result = await OrderService.shipConfirmOrder(
        { ...req.body, soCode: req.params.id || req.body.soCode },
        req.user
      );
      return sendSuccess(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async listDeliveries(req, res, next) {
    try {
      const deliveries = await OrderService.listDeliveries();
      return sendSuccess(res, deliveries, "Shipping deliveries retrieved");
    } catch (err) {
      next(err);
    }
  }

  // AR Invoices & Receipts
  static async listInvoices(req, res, next) {
    try {
      const invoices = await OrderService.listArInvoices(req.query);
      return sendSuccess(res, invoices, "AR invoices retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async getInvoice(req, res, next) {
    try {
      const invoice = await OrderService.getArInvoice(req.params.id);
      return sendSuccess(res, invoice, "AR invoice details retrieved");
    } catch (err) {
      next(err);
    }
  }

  static async createReceipt(req, res, next) {
    try {
      const result = await OrderService.createArReceipt(req.body, req.user);
      return sendCreated(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  static async listReceipts(req, res, next) {
    try {
      const receipts = await OrderService.listArReceipts();
      return sendSuccess(res, receipts, "AR receipts retrieved");
    } catch (err) {
      next(err);
    }
  }
}

