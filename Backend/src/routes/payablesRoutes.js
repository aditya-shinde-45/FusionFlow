import { Router } from "express";
import { PayablesController } from "../controllers/payablesController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { invoiceCreateSchema, holdReleaseSchema, paymentBatchCreateSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

// ==========================================
// AP Invoices
// ==========================================

router.get("/invoices", authorizePermissions(PERMISSIONS.INVOICE_VIEW), PayablesController.listInvoices);
router.get("/invoices/:id", authorizePermissions(PERMISSIONS.INVOICE_VIEW), PayablesController.getInvoiceById);

router.post(
  "/invoices",
  authorizePermissions(PERMISSIONS.INVOICE_CREATE),
  validate(invoiceCreateSchema),
  logAuditEvent("CREATE_INVOICE", "INVOICE", (req, data) => ({
    entityId: data.data?.code,
    details: `Created invoice ${data.data?.code} (${data.data?.status}) against PO ${data.data?.poCode}`,
  })),
  PayablesController.createInvoice
);

// ==========================================
// Holds
// ==========================================

router.get("/holds", authorizePermissions(PERMISSIONS.HOLD_VIEW), PayablesController.listHolds);

router.post(
  "/holds/:id/release",
  authorizePermissions(PERMISSIONS.HOLD_RELEASE),
  validate(holdReleaseSchema),
  logAuditEvent("RELEASE_HOLD", "HOLD", (req) => ({
    entityId: req.params.id,
    details: `Released hold ${req.params.id} (Reason: ${req.body.reason})`,
  })),
  PayablesController.releaseHold
);

// ==========================================
// Payments & Payment Batches
// ==========================================

router.get("/payments", authorizePermissions(PERMISSIONS.PAYMENT_VIEW), PayablesController.listPaymentBatches);
router.get("/payments/batches", authorizePermissions(PERMISSIONS.PAYMENT_VIEW), PayablesController.listPaymentBatches);

router.post(
  "/payments/batches",
  authorizePermissions(PERMISSIONS.PAYMENT_PROCESS),
  validate(paymentBatchCreateSchema),
  logAuditEvent("CREATE_PAYMENT_BATCH", "PAYMENT_BATCH", (req, data) => ({
    entityId: data.data?.code,
    details: `Created payment batch ${data.data?.code} for ₹ ${data.data?.totalAmount}`,
  })),
  PayablesController.createPaymentBatch
);

router.post(
  "/payments/batches/:id/process",
  authorizePermissions(PERMISSIONS.PAYMENT_PROCESS),
  logAuditEvent("PROCESS_PAYMENT_BATCH", "PAYMENT_BATCH", (req) => ({
    entityId: req.params.id,
    details: `Processed payment batch ${req.params.id}`,
  })),
  PayablesController.processPaymentBatch
);

router.get(
  "/payments/batches/:id/export-bank",
  authorizePermissions(PERMISSIONS.PAYMENT_VIEW),
  PayablesController.exportBankBatch
);

export default router;

