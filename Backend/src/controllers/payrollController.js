import { PayrollService } from "../services/payrollService.js";
import { successResponse } from "../utils/response.js";

export class PayrollController {
  // Periods
  static async listPeriods(req, res, next) {
    try {
      const data = await PayrollService.listPeriods();
      return successResponse(res, { data, message: "Payroll periods retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async createPeriod(req, res, next) {
    try {
      const data = await PayrollService.createPeriod(req.body);
      return successResponse(res, { data, message: "Payroll period created", statusCode: 201 });
    } catch (err) {
      next(err);
    }
  }

  // Runs
  static async listRuns(req, res, next) {
    try {
      const data = await PayrollService.listRuns();
      return successResponse(res, { data, message: "Payroll runs retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async getRunById(req, res, next) {
    try {
      const data = await PayrollService.getRunById(req.params.id);
      return successResponse(res, { data, message: "Payroll run details retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async calculate(req, res, next) {
    try {
      const data = await PayrollService.calculatePayrollRun(req.body);
      return successResponse(res, {
        data,
        message: `Payroll calculation completed for period ${req.body.periodCode}`,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitForApproval(req, res, next) {
    try {
      const data = await PayrollService.submitPayrollRunForApproval(req.params.id, req.user);
      return successResponse(res, {
        data,
        message: "Payroll run submitted for executive approval",
      });
    } catch (err) {
      next(err);
    }
  }

  static async approve(req, res, next) {
    try {
      const data = await PayrollService.approvePayrollRun(req.params.id, req.user);
      return successResponse(res, {
        data,
        message: "Payroll run approved successfully",
      });
    } catch (err) {
      next(err);
    }
  }

  static async finalize(req, res, next) {
    try {
      const data = await PayrollService.finalizePayrollRun(req.params.id, req.user);
      return successResponse(res, {
        data,
        message: "Payroll run finalized, locked, and payslips distributed",
      });
    } catch (err) {
      next(err);
    }
  }

  static async exportBank(req, res, next) {
    try {
      const data = await PayrollService.exportBankInstructions(req.params.id);
      return successResponse(res, {
        data,
        message: "Bank payment instruction batch generated",
      });
    } catch (err) {
      next(err);
    }
  }

  // Payslips
  static async listPayslips(req, res, next) {
    try {
      const isHrOrAdmin = ["admin", "plant.head", "hr.manager", "accounts.clerk", "auditor"].includes(req.user.role);
      const employeeId = isHrOrAdmin ? req.query.employeeId : req.user.employeeId;
      const data = await PayrollService.listPayslips({ employeeId, periodCode: req.query.periodCode });
      return successResponse(res, { data, message: "Payslips retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async getPayslipById(req, res, next) {
    try {
      const data = await PayrollService.getPayslipById(req.params.id, req.user.employeeId, req.user.role);
      return successResponse(res, { data, message: "Payslip details retrieved" });
    } catch (err) {
      next(err);
    }
  }
}

