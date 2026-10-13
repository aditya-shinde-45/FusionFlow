import { Router } from "express";
import { ApprovalController } from "../controllers/approvalController.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { approvalActSchema } from "../validators/schemas.js";

const router = Router();

router.use(authenticate);

router.get("/rules", ApprovalController.listRules);
router.get("/", ApprovalController.list);
router.get("/:id", ApprovalController.getById);

router.post(
  "/:id/action",
  validate(approvalActSchema),
  logAuditEvent("APPROVAL_ACTION", "APPROVAL_REQUEST", (req) => ({ entityId: req.params.id, details: `Action '${req.body.action}' on ${req.params.id}` })),
  ApprovalController.act
);

export default router;

