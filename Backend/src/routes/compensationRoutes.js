import { Router } from "express";
import { CompensationController } from "../controllers/compensationController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { salaryRevisionSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

router.get(
  "/employees/:employeeId",
  authorizePermissions(PERMISSIONS.COMPENSATION_VIEW),
  CompensationController.getByEmployeeId
);

router.get(
  "/:employeeId",
  authorizePermissions(PERMISSIONS.COMPENSATION_VIEW),
  CompensationController.getByEmployeeId
);

router.post(
  "/revisions",
  authorizePermissions(PERMISSIONS.COMPENSATION_MANAGE),
  validate(salaryRevisionSchema),
  logAuditEvent("SALARY_REVISION", "COMPENSATION", (req, data) => ({ entityId: data.data?.id, details: `Submitted salary revision for employee ${req.body.employeeId}` })),
  CompensationController.submitRevision
);

export default router;

