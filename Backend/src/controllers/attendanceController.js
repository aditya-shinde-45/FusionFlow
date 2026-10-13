import { AttendanceService } from "../services/attendanceService.js";
import { successResponse } from "../utils/response.js";

export class AttendanceController {
  static async list(req, res, next) {
    try {
      const data = await AttendanceService.listAttendance(req.query);
      return successResponse(res, { data, message: "Attendance records retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async clockIn(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const data = await AttendanceService.clockIn({ ...req.body, employeeId });
      return successResponse(res, { data, message: "Clock-in recorded successfully", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async clockOut(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const data = await AttendanceService.clockOut({ ...req.body, employeeId });
      return successResponse(res, { data, message: "Clock-out recorded successfully" });
    } catch (err) {
      next(err);
    }
  }

  static async correction(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const data = await AttendanceService.submitAttendanceCorrection({ ...req.body, employeeId });
      return successResponse(res, { data, message: "Attendance correction submitted for approval", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  static async summary(req, res, next) {
    try {
      const employeeId = req.params.employeeId || req.query.employeeId || req.user.employeeId;
      const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
      const data = await AttendanceService.getMonthlySummary(employeeId, year, month);
      return successResponse(res, { data, message: "Attendance monthly summary retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async listOvertime(req, res, next) {
    try {
      const data = await AttendanceService.listOvertime(req.query);
      return successResponse(res, { data, message: "Overtime records retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async requestOvertime(req, res, next) {
    try {
      const employeeId = req.body.employeeId || req.user.employeeId;
      const data = await AttendanceService.requestOvertime({ ...req.body, employeeId });
      return successResponse(res, { data, message: "Overtime request submitted for approval", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }
}

