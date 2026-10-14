import { Router } from "express";
import { ProcurementController } from "../controllers/procurementController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { purchaseRequisitionCreateSchema, poCreateSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const requisitionRouter = Router();
const poRouter = Router();

requisitionRouter.use(authenticate);
poRouter.use(authenticate);

// ==========================================
// Requisition Routes
// ==========================================

requisitionRouter.get(
  "/",
  authorizePermissions(PERMISSIONS.REQUISITION_VIEW),
  ProcurementController.listRequisitions
);

requisitionRouter.get(
  "/:id",
  authorizePermissions(PERMISSIONS.REQUISITION_VIEW),
  ProcurementController.getRequisitionById
);

requisitionRouter.post(
  "/",
  authorizePermissions(PERMISSIONS.REQUISITION_CREATE),
  validate(purchaseRequisitionCreateSchema),
  logAuditEvent("CREATE_REQUISITION", "REQUISITION", (req, data) => ({
    entityId: data.data?.id,
    details: `Created requisition ${data.data?.code} for ₹ ${data.data?.totalAmount}`,
  })),
  ProcurementController.createRequisition
);

requisitionRouter.post(
  "/:id/approve",
  authorizePermissions(PERMISSIONS.REQUISITION_APPROVE),
  logAuditEvent("APPROVE_REQUISITION", "REQUISITION", (req) => ({
    entityId: req.params.id,
    details: `Approved requisition ${req.params.id}`,
  })),
  ProcurementController.approveRequisition
);

requisitionRouter.post(
  "/:id/convert-to-po",
  authorizePermissions(PERMISSIONS.PO_CREATE),
  logAuditEvent("CONVERT_TO_PO", "PURCHASE_ORDER", (req, data) => ({
    entityId: data.data?.code,
    details: `Converted requisition ${req.params.id} to PO ${data.data?.code}`,
  })),
  ProcurementController.convertToPo
);

// ==========================================
// Purchase Order Routes
// ==========================================

poRouter.get(
  "/",
  authorizePermissions(PERMISSIONS.PO_VIEW),
  ProcurementController.listPurchaseOrders
);

poRouter.get(
  "/:id",
  authorizePermissions(PERMISSIONS.PO_VIEW),
  ProcurementController.getPoById
);

poRouter.post(
  "/",
  authorizePermissions(PERMISSIONS.PO_CREATE),
  validate(poCreateSchema),
  logAuditEvent("CREATE_PO", "PURCHASE_ORDER", (req, data) => ({
    entityId: data.data?.code,
    details: `Created PO ${data.data?.code} for ${data.data?.supplierName}`,
  })),
  ProcurementController.createPo
);

export { requisitionRouter, poRouter };

