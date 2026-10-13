import { db } from "../config/database.js";
import { generateCode, generateUUID } from "../utils/idGenerator.js";
import { DecimalSafe } from "../utils/currency.js";

// India Statutory Payroll Rules (Configurable)
export const STATUTORY_CONFIG = {
  PROVIDENT_FUND: {
    EMPLOYEE_RATE: 12.0, // 12%
    EMPLOYER_RATE: 12.0, // 12% (3.67% EPF + 8.33% EPS)
    STATUTORY_WAGE_CEILING: 15000.0,
    APPLY_CEILING: false, // In manufacturing plants, often computed on full basic or ceiling
  },
  ESI: {
    ELIGIBILITY_GROSS_CEILING: 21000.0,
    EMPLOYEE_RATE: 0.75, // 0.75%
    EMPLOYER_RATE: 3.25, // 3.25%
  },
  PROFESSIONAL_TAX_MAHARASHTRA: {
    SLABS: [
      { min: 0, max: 7500, amount: 0 },
      { min: 7501, max: 10000, amount: 175 },
      { min: 10001, max: Infinity, amount: 200 }, // Standard 200 INR/month (300 in Feb)
    ],
  },
  OVERTIME_MULTIPLIER: 2.0, // Factories Act double rate for overtime
};

export class PayrollService {
  // Periods
  static async listPeriods() {
    return db.collection("payroll_periods").find();
  }

  static async createPeriod({ year, month, daysInMonth }) {
    const code = `${year}-${String(month).padStart(2, "0")}`;
    const existing = await db.collection("payroll_periods").findOne((p) => p.code === code);
    if (existing) {
      throw { statusCode: 409, code: "PERIOD_EXISTS", message: `Payroll period ${code} already exists` };
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const days = daysInMonth || new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(days).padStart(2, "0")}`;

    // Pay date is 1st of next month
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const payDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    return db.collection("payroll_periods").insert({
      id: `PP-${code}`,
      code,
      year: Number(year),
      month: Number(month),
      startDate,
      endDate,
      payDate,
      daysInMonth: days,
      status: "Draft",
    });
  }

  // Runs
  static async listRuns() {
    return db.collection("payroll_runs").find();
  }

  static async getRunById(id) {
    const run = await db.collection("payroll_runs").findOne((r) => r.id === id || r.code === id);
    if (!run) {
      throw { statusCode: 404, code: "RUN_NOT_FOUND", message: `Payroll run not found: ${id}` };
    }
    const payslips = await db.collection("payslips").find((p) => p.payrollRunId === run.id || p.periodCode === run.periodCode);
    return { ...run, payslips };
  }

  // Workflow B & 8: Execute Payroll Calculation Engine
  static async calculatePayrollRun({ periodCode, payGroup = "Permanent Plant Staff" }) {
    const period = await db.collection("payroll_periods").findOne((p) => p.code === periodCode);
    if (!period) {
      throw { statusCode: 404, code: "PERIOD_NOT_FOUND", message: `Period ${periodCode} not found` };
    }

    // Check if period is already finalized
    const existingRun = await db.collection("payroll_runs").findOne((r) => r.periodCode === periodCode);
    if (existingRun && existingRun.locked) {
      throw {
        statusCode: 400,
        code: "PAYROLL_LOCKED",
        message: `Payroll run for ${periodCode} is finalized and locked against modification`,
      };
    }

    // Step 2: Select eligible active employees
    const employees = await db.collection("employees").find((e) => e.status === "Active");
    if (employees.length === 0) {
      throw { statusCode: 400, code: "NO_ELIGIBLE_EMPLOYEES", message: "No active employees found for payroll processing" };
    }

    const calculatedSlips = [];
    let totalGrossPaise = 0n;
    let totalDeductionsPaise = 0n;
    let totalNetPaise = 0n;

    for (const emp of employees) {
      // Step 3: Effective compensation record
      const comp = await db.collection("compensation_records").findOne((c) => c.employeeId === emp.id && c.status === "Active");
      const basicSalary = comp ? comp.basicSalary : 25000.0;
      const hra = comp ? comp.hra : 10000.0;
      const specialAllowance = comp ? comp.specialAllowance : 5000.0;

      // Step 4: Import approved attendance & overtime for this period
      const attendance = await db.collection("attendance_records").find(
        (a) => a.employeeId === emp.id && a.date.startsWith(periodCode)
      );
      const totalOvertimeHours = attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

      // Overtime rate: (Basic / Days / 8) * 2.0
      const hourlyBasic = DecimalSafe.divide(basicSalary, period.daysInMonth * 8);
      const otHourlyRate = DecimalSafe.percent(hourlyBasic, STATUTORY_CONFIG.OVERTIME_MULTIPLIER * 100);
      const overtimeEarnings = DecimalSafe.percent(otHourlyRate, totalOvertimeHours * 100);

      // Step 5: Import approved leave and unpaid absence (Loss of Pay / LOP)
      const approvedLeaves = await db.collection("leave_requests").find(
        (l) => l.employeeId === emp.id && l.status === "Approved" && l.startDate.startsWith(periodCode)
      );
      const lopLeaves = approvedLeaves.filter((l) => l.leaveTypeCode === "LOP");
      const lopDays = lopLeaves.reduce((sum, l) => sum + l.daysCount, 0);

      // LOP deduction = (Basic / Days) * LOPDays
      const dailyRate = DecimalSafe.divide(basicSalary, period.daysInMonth);
      const lopDeduction = DecimalSafe.percent(dailyRate, lopDays * 100);

      // Step 6: Calculate Gross Earnings
      const grossEarnings = DecimalSafe.subtract(
        DecimalSafe.add(basicSalary, hra, specialAllowance, overtimeEarnings),
        lopDeduction
      );

      // Step 7: Statutory Deductions (India-compliant)
      // Provident Fund: 12% of basic
      const pfWage = STATUTORY_CONFIG.PROVIDENT_FUND.APPLY_CEILING
        ? Math.min(basicSalary, STATUTORY_CONFIG.PROVIDENT_FUND.STATUTORY_WAGE_CEILING)
        : basicSalary;
      const pfAmount = comp?.pfEligible !== false ? DecimalSafe.percent(pfWage, STATUTORY_CONFIG.PROVIDENT_FUND.EMPLOYEE_RATE) : 0;

      // ESI: 0.75% of gross if gross <= 21,000
      let esiAmount = 0;
      if (grossEarnings <= STATUTORY_CONFIG.ESI.ELIGIBILITY_GROSS_CEILING && comp?.esiEligible) {
        esiAmount = DecimalSafe.percent(grossEarnings, STATUTORY_CONFIG.ESI.EMPLOYEE_RATE);
      }

      // Professional Tax (Maharashtra)
      let pTaxAmount = 200;
      if (grossEarnings <= 7500) pTaxAmount = 0;
      else if (grossEarnings <= 10000) pTaxAmount = 175;
      else pTaxAmount = period.month === 2 ? 300 : 200;

      // Income Tax TDS projection (simplified progressive slab)
      let tdsAmount = 0;
      const annualizedGross = grossEarnings * 12;
      if (annualizedGross > 700000) {
        // Taxable portion above 7L at 10%
        const taxable = annualizedGross - 700000;
        tdsAmount = DecimalSafe.divide(DecimalSafe.percent(taxable, 10), 12);
      }

      // Step 8: Total Deductions & Net Salary
      const totalDeductions = DecimalSafe.add(pfAmount, esiAmount, pTaxAmount, tdsAmount);
      const netPayable = DecimalSafe.subtract(grossEarnings, totalDeductions);

      totalGrossPaise += DecimalSafe.toPaise(grossEarnings);
      totalDeductionsPaise += DecimalSafe.toPaise(totalDeductions);
      totalNetPaise += DecimalSafe.toPaise(netPayable);

      calculatedSlips.push({
        id: `PSLIP-${periodCode}-${emp.employeeNumber || emp.id}`,
        payrollRunId: existingRun ? existingRun.id : `PAY-${periodCode}`,
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        employeeName: emp.fullName,
        periodCode,
        department: emp.department,
        designation: emp.job,
        pan: emp.pan,
        uan: emp.uan,
        bankAccount: emp.bankAccount,
        bankName: emp.bankName,
        workedDays: period.daysInMonth - lopDays,
        lopDays,
        overtimeHours: totalOvertimeHours,
        basic: basicSalary,
        hra,
        specialAllowance,
        overtime: overtimeEarnings,
        lopDeduction,
        grossEarnings,
        providentFund: pfAmount,
        esi: esiAmount,
        professionalTax: pTaxAmount,
        incomeTaxTds: tdsAmount,
        totalDeductions,
        netPayable,
        status: "Draft",
        paymentMethod: "NEFT",
        paymentRef: null,
      });
    }

    const runData = {
      id: existingRun ? existingRun.id : `PAY-${periodCode}`,
      code: `PAY-${periodCode}`,
      periodId: period.id,
      periodCode,
      payGroup,
      eligibleEmployeesCount: employees.length,
      totalGross: DecimalSafe.toRupeesNumber(totalGrossPaise),
      totalDeductions: DecimalSafe.toRupeesNumber(totalDeductionsPaise),
      totalNet: DecimalSafe.toRupeesNumber(totalNetPaise),
      status: "Calculated",
      locked: false,
      calculatedAt: new Date().toISOString(),
      bankInstructionExported: false,
    };

    if (existingRun) {
      await db.collection("payroll_runs").updateById(existingRun.id, runData);
      // Remove old draft payslips
      await db.collection("payslips").delete((p) => p.periodCode === periodCode);
    } else {
      await db.collection("payroll_runs").insert(runData);
    }

    // Insert new calculated payslips
    for (const slip of calculatedSlips) {
      await db.collection("payslips").insert(slip);
    }

    return {
      run: runData,
      payslipsCount: calculatedSlips.length,
      payslips: calculatedSlips,
    };
  }

  static async submitPayrollRunForApproval(runId, user) {
    const run = await db.collection("payroll_runs").findById(runId);
    if (!run) {
      throw { statusCode: 404, code: "RUN_NOT_FOUND", message: "Payroll run not found" };
    }
    if (run.locked) {
      throw { statusCode: 400, code: "PAYROLL_LOCKED", message: "Payroll run is locked" };
    }

    const updated = await db.collection("payroll_runs").updateById(runId, {
      status: "Pending approval",
      submittedBy: user.name,
      submittedAt: new Date().toISOString(),
    });

    // Create workflow approval request for Plant Head / Executive
    await db.collection("approval_requests").insert({
      id: run.id,
      code: run.code,
      entityType: "PAYROLL",
      title: `Payroll Run ${run.code}: ₹ ${run.totalNet.toLocaleString("en-IN")}.00 Net Payable`,
      amountFormatted: `₹ ${run.totalNet.toLocaleString("en-IN")}.00`,
      amount: run.totalNet,
      requesterName: user.name,
      requesterId: user.employeeId || user.id,
      department: "Human Resources",
      stage: "Level 1 of 1",
      assignedToRole: "plant.head",
      status: "Pending approval",
      createdAt: new Date().toISOString(),
      history: [],
    });

    return updated;
  }

  static async approvePayrollRun(runId, user) {
    const run = await db.collection("payroll_runs").findById(runId);
    if (!run) {
      throw { statusCode: 404, code: "RUN_NOT_FOUND", message: "Payroll run not found" };
    }

    const updated = await db.collection("payroll_runs").updateById(runId, {
      status: "Approved",
      approvedBy: user.name,
      approvedAt: new Date().toISOString(),
    });

    // Update approval request
    await db.collection("approval_requests").updateById(run.id, {
      status: "Approved",
    });

    return updated;
  }

  static async finalizePayrollRun(runId, user) {
    const run = await db.collection("payroll_runs").findById(runId);
    if (!run) {
      throw { statusCode: 404, code: "RUN_NOT_FOUND", message: "Payroll run not found" };
    }
    if (run.locked) {
      return run; // Idempotent return
    }

    const finalizedAt = new Date().toISOString();
    const updated = await db.collection("payroll_runs").updateById(runId, {
      status: "Finalized",
      locked: true,
      finalizedBy: user.name,
      finalizedAt,
    });

    // Finalize all payslips and update period status
    const payslips = await db.collection("payslips").find((p) => p.periodCode === run.periodCode);
    for (const p of payslips) {
      await db.collection("payslips").updateById(p.id, {
        status: "Published",
        paymentMethod: "NEFT",
        paymentRef: `NEFT-HDFC-${Date.now().toString().slice(-8)}`,
      });
      // Send notification to each employee that payslip is published
      const emp = await db.collection("employees").findById(p.employeeId);
      if (emp?.userId) {
        await db.collection("notifications").insert({
          id: generateUUID(),
          userId: emp.userId,
          type: "PAYROLL",
          title: "Payslip published",
          message: `Your payslip for ${run.periodCode} is available to view.`,
          unread: true,
          createdAt: finalizedAt,
          link: "/me",
        });
      }
    }

    await db.collection("payroll_periods").updateById(run.periodId, { status: "Finalized" });

    return updated;
  }

  static async exportBankInstructions(runId) {
    const run = await db.collection("payroll_runs").findById(runId);
    if (!run) {
      throw { statusCode: 404, code: "RUN_NOT_FOUND", message: "Payroll run not found" };
    }

    const payslips = await db.collection("payslips").find((p) => p.periodCode === run.periodCode);
    const bankBatch = payslips.map((p, i) => ({
      transactionRef: `NEFT-PAY-${run.periodCode}-${String(i + 1).padStart(4, "0")}`,
      beneficiaryName: p.employeeName,
      accountNumber: p.bankAccount,
      ifscCode: "HDFC0000486",
      amount: p.netPayable,
      currency: "INR",
      paymentDate: new Date().toISOString().split("T")[0],
      purposeCode: "SALARY_PAYMENT",
    }));

    await db.collection("payroll_runs").updateById(runId, { bankInstructionExported: true });

    return {
      batchId: `BATCH-${run.code}-${Date.now().toString().slice(-6)}`,
      sponsorAccount: "5020000482100", // Sahyadri Auto Operating Account
      totalRecords: bankBatch.length,
      totalAmount: run.totalNet,
      records: bankBatch,
    };
  }

  // Payslips list and detail
  static async listPayslips({ employeeId, periodCode }) {
    return db.collection("payslips").find((p) => {
      if (employeeId && p.employeeId !== employeeId) return false;
      if (periodCode && p.periodCode !== periodCode) return false;
      return true;
    });
  }

  static async getPayslipById(id, requestingEmployeeId, role) {
    const slip = await db.collection("payslips").findOne((p) => p.id === id);
    if (!slip) {
      throw { statusCode: 404, code: "PAYSLIP_NOT_FOUND", message: "Payslip not found" };
    }

    // Role security check: Employee can ONLY access their own payslip!
    const isHrOrAdmin = ["admin", "plant.head", "hr.manager", "accounts.clerk", "auditor"].includes(role);
    if (!isHrOrAdmin && slip.employeeId !== requestingEmployeeId) {
      throw {
        statusCode: 403,
        code: "UNAUTHORIZED_PAYSLIP_ACCESS",
        message: "You are not authorized to view another employee's payslip",
      };
    }

    return slip;
  }
}

