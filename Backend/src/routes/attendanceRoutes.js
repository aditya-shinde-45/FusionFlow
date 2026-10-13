import { Router } from "express";
import { AttendanceController } from "../controllers/attendanceController.js";
import { authenticate } from "../middleware/auth.js";
import { authorizePermissions } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { logAuditEvent } from "../middleware/auditLogger.js";
import { attendanceClockSchema, attendanceCorrectionSchema, overtimeRequestSchema } from "../validators/schemas.js";
import { PERMISSIONS } from "../constants/roles.js";

const router = Router();

router.use(authenticate);

// Clock in / out
router.post(
  "/clock-in",
  authorizePermissions(PERMISSIONS.ATTENDANCE_LOG),
  validate(attendanceClockSchema),
  AttendanceController.clockIn
);
router.post(
  "/clock-out",
  authorizePermissions(PERMISSIONS.ATTENDANCE_LOG),
  validate(attendanceClockSchema),
  AttendanceController.clockOut
);

// Attendance query & summary
router.get("/", authorizePermissions(PERMISSIONS.ATTENDANCE_VIEW), AttendanceController.list);
router.get("/summary", authorizePermissions(PERMISSIONS.ATTENDANCE_VIEW), AttendanceController.summary);

// Attendance correction
router.post(
  "/correction",
  authorizePermissions(PERMISSIONS.ATTENDANCE_CORRECT),
  validate(attendanceCorrectionSchema),
  AttendanceController.correction
);

// Overtime
router.get("/overtime", authorizePermissions(PERMISSIONS.ATTENDANCE_VIEW), AttendanceController.listOvertime);
router.post(
  "/overtime",
  authorizePermissions(PERMISSIONS.ATTENDANCE_LOG),
  validate(overtimeRequestSchema),
  AttendanceController.requestOvertime
);

export default router;

