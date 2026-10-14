import { Router } from "express";
import { ReceivingController } from "../controllers/receivingController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { receivingCreateSchema, returnCreateSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

router.get("/receipts", authorizePermissions(PERMISSIONS.RECEIVING_VIEW), ReceivingController.listReceipts);
router.get("/receipts/:id", authorizePermissions(PERMISSIONS.RECEIVING_VIEW), ReceivingController.getReceiptById);

// Direct shortcut
router.get("/", authorizePermissions(PERMISSIONS.RECEIVING_VIEW), ReceivingController.listReceipts);

router.post(
  "/",
  authorizePermissions(PERMISSIONS.RECEIVING_CREATE),
  validate(receivingCreateSchema),
  logAuditEvent("GOODS_RECEIPT", "RECEIPT", (req, data) => ({
    entityId: data.data?.code,
    details: `Received GRN ${data.data?.code} against PO ${data.data?.poCode}`,
  })),
  ReceivingController.createReceipt
);

router.get("/returns", authorizePermissions(PERMISSIONS.RECEIVING_VIEW), ReceivingController.listReturns);

router.post(
  "/returns",
  authorizePermissions(PERMISSIONS.RECEIVING_CREATE),
  validate(returnCreateSchema),
  logAuditEvent("RETURN_TO_VENDOR", "RETURN", (req, data) => ({
    entityId: data.data?.code,
    details: `Issued RTV ${data.data?.code} for receipt ${data.data?.receiptCode}`,
  })),
  ReceivingController.createReturn
);

export default router;

