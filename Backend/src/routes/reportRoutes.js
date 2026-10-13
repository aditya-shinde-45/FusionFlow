import { Router } from "express";
import { ReportController } from "../controllers/reportController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

router.get("/headcount", authorizePermissions(PERMISSIONS.REPORTS_VIEW), ReportController.headcount);
router.get("/recruitment", authorizePermissions(PERMISSIONS.REPORTS_VIEW), ReportController.recruitment);
router.get("/leave-utilization", authorizePermissions(PERMISSIONS.REPORTS_VIEW), ReportController.leaveUtilization);
router.get("/attendance", authorizePermissions(PERMISSIONS.REPORTS_VIEW), ReportController.attendance);
router.get("/payroll-cost", authorizePermissions(PERMISSIONS.REPORTS_FINANCIAL), ReportController.payrollCost);

export default router;

