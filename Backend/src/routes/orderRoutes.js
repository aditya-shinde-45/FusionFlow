import { Router } from "express";
import { OrderController } from "../controllers/orderController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { PERMISSIONS } from "../constants/roles.js";

// Customer Router
export const customerRouter = Router();
customerRouter.use(authenticate);
customerRouter.get("/", authorizePermissions(PERMISSIONS.CUSTOMER_VIEW), OrderController.listCustomers);
customerRouter.get("/:id", authorizePermissions(PERMISSIONS.CUSTOMER_VIEW), OrderController.getCustomer);
customerRouter.post("/", authorizePermissions(PERMISSIONS.CUSTOMER_MANAGE), OrderController.createCustomer);

// Price List Router
export const priceListRouter = Router();
priceListRouter.use(authenticate);
priceListRouter.get("/", authorizePermissions(PERMISSIONS.CUSTOMER_VIEW), OrderController.listPriceLists);

// Sales Order Router
export const orderRouter = Router();
orderRouter.use(authenticate);
orderRouter.get("/", authorizePermissions(PERMISSIONS.SALES_ORDER_VIEW), OrderController.listOrders);
orderRouter.get("/:id", authorizePermissions(PERMISSIONS.SALES_ORDER_VIEW), OrderController.getOrder);
orderRouter.post("/", authorizePermissions(PERMISSIONS.SALES_ORDER_CREATE), OrderController.createOrder);
orderRouter.post("/:id/ship-confirm", authorizePermissions(PERMISSIONS.SHIPPING_CONFIRM), OrderController.shipConfirm);

// Shipping Router
export const shippingRouter = Router();
shippingRouter.use(authenticate);
shippingRouter.get("/", authorizePermissions(PERMISSIONS.SHIPPING_VIEW), OrderController.listDeliveries);
shippingRouter.post("/confirm", authorizePermissions(PERMISSIONS.SHIPPING_CONFIRM), OrderController.shipConfirm);

// Receivables (AR) Router
export const arRouter = Router();
arRouter.use(authenticate);
arRouter.get("/invoices", authorizePermissions(PERMISSIONS.AR_INVOICE_VIEW), OrderController.listInvoices);
arRouter.get("/invoices/:id", authorizePermissions(PERMISSIONS.AR_INVOICE_VIEW), OrderController.getInvoice);
arRouter.get("/receipts", authorizePermissions(PERMISSIONS.AR_RECEIPT_VIEW), OrderController.listReceipts);
arRouter.post("/receipts", authorizePermissions(PERMISSIONS.AR_RECEIPT_CREATE), OrderController.createReceipt);

