import { db } from "../config/database.js";

export class ReportService {
  static async getHeadcountReport() {
    const employees = await db.collection("employees").find();
    const active = employees.filter((e) => e.status === "Active");

    const byDepartment = {};
    const byGrade = {};
    const byGender = {};

    for (const e of active) {
      byDepartment[e.department] = (byDepartment[e.department] || 0) + 1;
      byGrade[e.grade] = (byGrade[e.grade] || 0) + 1;
      byGender[e.gender] = (byGender[e.gender] || 0) + 1;
    }

    return {
      totalEmployees: employees.length,
      activeHeadcount: active.length,
      inactiveHeadcount: employees.length - active.length,
      byDepartment,
      byGrade,
      byGender,
    };
  }

  static async getRecruitmentFunnel() {
    const requisitions = await db.collection("job_requisitions").find();
    const candidates = await db.collection("candidates").find();
    const interviews = await db.collection("interviews").find();
    const offers = await db.collection("job_offers").find();

    const stageBreakdown = {
      Applied: candidates.filter((c) => c.currentStage === "Applied").length,
      Interview: candidates.filter((c) => c.currentStage === "Interview").length,
      Selected: candidates.filter((c) => c.currentStage === "Selected").length,
      Offered: candidates.filter((c) => c.currentStage === "Offered").length,
      Hired: candidates.filter((c) => c.currentStage === "Hired").length,
      Rejected: candidates.filter((c) => c.currentStage === "Rejected").length,
    };

    return {
      totalRequisitions: requisitions.length,
      openRequisitions: requisitions.filter((r) => r.status === "Open").length,
      totalApplicants: candidates.length,
      interviewsConducted: interviews.length,
      offersExtended: offers.length,
      offersAccepted: offers.filter((o) => o.status === "Accepted").length,
      stageBreakdown,
    };
  }

  static async getLeaveUtilizationReport() {
    const requests = await db.collection("leave_requests").find((l) => l.status === "Approved");
    const byType = {};
    let totalDays = 0;

    for (const r of requests) {
      byType[r.leaveTypeCode] = (byType[r.leaveTypeCode] || 0) + r.daysCount;
      totalDays += r.daysCount;
    }

    return {
      totalApprovedLeaveDays: totalDays,
      leaveUtilizationByType: byType,
      requestsCount: requests.length,
    };
  }

  static async getAttendanceReport() {
    const records = await db.collection("attendance_records").find();
    const present = records.filter((r) => r.status === "Present").length;
    const late = records.filter((r) => r.isLate).length;
    const totalOT = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    return {
      totalPunches: records.length,
      presentPunches: present,
      lateArrivals: late,
      totalOvertimeHours: parseFloat(totalOT.toFixed(1)),
      onTimeRatePercent: records.length ? parseFloat((((records.length - late) / records.length) * 100).toFixed(1)) : 100,
    };
  }

  static async getPayrollCostReport() {
    const runs = await db.collection("payroll_runs").find();
    const payslips = await db.collection("payslips").find();

    const costByDepartment = {};
    for (const p of payslips) {
      costByDepartment[p.department] = (costByDepartment[p.department] || 0) + (p.grossEarnings || 0);
    }

    return {
      totalRunsProcessed: runs.length,
      latestRun: runs[runs.length - 1] || null,
      costByDepartment,
    };
  }
}

