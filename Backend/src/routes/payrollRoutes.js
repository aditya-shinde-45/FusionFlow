import { Router } from "express";
import { PayrollController } from "../controllers/payrollController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { payrollCalculateSchema, payrollPeriodSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

// Periods
router.get("/periods", authorizePermissions(PERMISSIONS.PAYROLL_VIEW_ALL), PayrollController.listPeriods);
router.post(
  "/periods",
  authorizePermissions(PERMISSIONS.PAYROLL_PROCESS),
  validate(payrollPeriodSchema),
  PayrollController.createPeriod
);

// Runs
router.get("/runs", authorizePermissions(PERMISSIONS.PAYROLL_VIEW_ALL), PayrollController.listRuns);
router.get("/runs/:id", authorizePermissions(PERMISSIONS.PAYROLL_VIEW_ALL), PayrollController.getRunById);

// Calculate engine
router.post(
  "/runs/calculate",
  authorizePermissions(PERMISSIONS.PAYROLL_PROCESS),
  validate(payrollCalculateSchema),
  logAuditEvent("CALCULATE_PAYROLL", "PAYROLL_RUN", (req, data) => ({ entityId: data.data?.run?.id, details: `Calculated payroll for ${req.body.periodCode}` })),
  PayrollController.calculate
);

// Approval & Finalization workflow
router.post(
  "/runs/:id/submit",
  authorizePermissions(PERMISSIONS.PAYROLL_PROCESS),
  logAuditEvent("SUBMIT_PAYROLL", "PAYROLL_RUN", (req) => ({ entityId: req.params.id, details: `Submitted payroll run ${req.params.id} for approval` })),
  PayrollController.submitForApproval
);

router.post(
  "/runs/:id/approve",
  authorizePermissions(PERMISSIONS.PAYROLL_APPROVE),
  logAuditEvent("APPROVE_PAYROLL", "PAYROLL_RUN", (req) => ({ entityId: req.params.id, details: `Approved payroll run ${req.params.id}` })),
  PayrollController.approve
);

router.post(
  "/runs/:id/finalize",
  authorizePermissions(PERMISSIONS.PAYROLL_FINALIZE),
  logAuditEvent("FINALIZE_PAYROLL", "PAYROLL_RUN", (req) => ({ entityId: req.params.id, details: `Finalized and locked payroll run ${req.params.id}` })),
  PayrollController.finalize
);

// Bank Payment Instructions Export
router.get(
  "/runs/:id/export-bank",
  authorizePermissions(PERMISSIONS.PAYROLL_VIEW_ALL),
  PayrollController.exportBank
);

// Payslips (Scoped!)
router.get("/payslips", PayrollController.listPayslips);
router.get("/payslips/:id", PayrollController.getPayslipById);

export default router;

