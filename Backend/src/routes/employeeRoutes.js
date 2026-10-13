import { Router } from "express";
import { EmployeeController } from "../controllers/employeeController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions, authorizeRoles, scopeEmployeeAccess } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { employeeCreateSchema, employeeUpdateSchema, employmentActionSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

router.get("/org-chart", EmployeeController.getOrgChart);
router.get("/", authorizePermissions(PERMISSIONS.EMPLOYEE_VIEW), EmployeeController.list);
router.get("/:id", scopeEmployeeAccess(), EmployeeController.getById);

router.post(
  "/",
  authorizePermissions(PERMISSIONS.EMPLOYEE_CREATE),
  validate(employeeCreateSchema),
  logAuditEvent("CREATE_EMPLOYEE", "EMPLOYEE", (req, data) => ({ entityId: data.data?.id, details: `Created employee ${data.data?.fullName}` })),
  EmployeeController.create
);

router.put(
  "/:id",
  authorizePermissions(PERMISSIONS.EMPLOYEE_UPDATE),
  validate(employeeUpdateSchema),
  logAuditEvent("UPDATE_EMPLOYEE", "EMPLOYEE", (req) => ({ entityId: req.params.id, details: `Updated profile for ${req.params.id}` })),
  EmployeeController.update
);

router.post(
  "/:id/actions",
  authorizePermissions(PERMISSIONS.EMPLOYEE_ACTION_INITIATE),
  validate(employmentActionSchema),
  logAuditEvent("EMPLOYMENT_ACTION", "EMPLOYEE", (req) => ({ entityId: req.params.id, details: `Action ${req.body.action} for ${req.params.id}` })),
  EmployeeController.performAction
);

export default router;

