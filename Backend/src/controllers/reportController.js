import { ReportService } from "../services/reportService.js";
import { successResponse } from "../utils/response.js";

export class ReportController {
  static async headcount(req, res, next) {
    try {
      const data = await ReportService.getHeadcountReport();
      return successResponse(res, { data, message: "Headcount report generated" });
    } catch (err) {
      next(err);
    }
  }

  static async recruitment(req, res, next) {
    try {
      const data = await ReportService.getRecruitmentFunnel();
      return successResponse(res, { data, message: "Recruitment funnel report generated" });
    } catch (err) {
      next(err);
    }
  }

  static async leaveUtilization(req, res, next) {
    try {
      const data = await ReportService.getLeaveUtilizationReport();
      return successResponse(res, { data, message: "Leave utilization report generated" });
    } catch (err) {
      next(err);
    }
  }

  static async attendance(req, res, next) {
    try {
      const data = await ReportService.getAttendanceReport();
      return successResponse(res, { data, message: "Attendance report generated" });
    } catch (err) {
      next(err);
    }
  }

  static async payrollCost(req, res, next) {
    try {
      const data = await ReportService.getPayrollCostReport();
      return successResponse(res, { data, message: "Payroll cost report generated" });
    } catch (err) {
      next(err);
    }
  }
}

