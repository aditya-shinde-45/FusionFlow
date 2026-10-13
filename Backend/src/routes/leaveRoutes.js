import { Router } from "express";
import { LeaveController } from "../controllers/leaveController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { leaveApplySchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

router.get("/types", LeaveController.listTypes);
router.get("/balances", LeaveController.getBalances);
router.get("/requests", authorizePermissions(PERMISSIONS.LEAVE_VIEW), LeaveController.listRequests);

router.post(
  "/requests",
  authorizePermissions(PERMISSIONS.LEAVE_APPLY),
  validate(leaveApplySchema),
  logAuditEvent("APPLY_LEAVE", "LEAVE_REQUEST", (req, data) => ({ entityId: data.data?.id, details: `Applied for leave ${data.data?.leaveTypeCode}` })),
  LeaveController.apply
);

router.post(
  "/requests/:id/cancel",
  logAuditEvent("CANCEL_LEAVE", "LEAVE_REQUEST", (req) => ({ entityId: req.params.id, details: `Cancelled leave request ${req.params.id}` })),
  LeaveController.cancel
);

export default router;

