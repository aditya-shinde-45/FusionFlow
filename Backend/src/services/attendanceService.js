import { db } from "../config/database.js";
import { generateCode, generateUUID } from "../utils/idGenerator.js";

export class AttendanceService {
  static async listAttendance({ employeeId, date, startDate, endDate, status }) {
    return db.collection("attendance_records").find((a) => {
      if (employeeId && a.employeeId !== employeeId) return false;
      if (date && a.date !== date) return false;
      if (startDate && a.date < startDate) return false;
      if (endDate && a.date > endDate) return false;
      if (status && a.status.toLowerCase() !== status.toLowerCase()) return false;
      return true;
    });
  }

  static async clockIn({ employeeId, shiftId = "shf-01", checkInTime, notes }) {
    const today = new Date().toISOString().split("T")[0];
    const timeNow = checkInTime || new Date().toTimeString().split(" ")[0].slice(0, 5);

    // Check if already clocked in today
    const existing = await db.collection("attendance_records").findOne((a) => a.employeeId === employeeId && a.date === today);
    if (existing) {
      throw { statusCode: 400, code: "ALREADY_CLOCKED_IN", message: "Employee already clocked in today" };
    }

    // Check shift to detect late arrival
    const shift = await db.collection("shifts").findById(shiftId);
    let isLate = false;
    if (shift && timeNow > shift.startTime) {
      isLate = true;
    }

    const record = {
      id: generateUUID(),
      employeeId,
      date: today,
      shiftId,
      checkIn: timeNow,
      checkOut: null,
      hoursWorked: 0,
      status: isLate ? "Late" : "Present",
      isLate,
      overtimeHours: 0,
      notes: notes || "",
    };

    return db.collection("attendance_records").insert(record);
  }

  static async clockOut({ employeeId, checkOutTime, notes }) {
    const today = new Date().toISOString().split("T")[0];
    const timeNow = checkOutTime || new Date().toTimeString().split(" ")[0].slice(0, 5);

    const record = await db.collection("attendance_records").findOne((a) => a.employeeId === employeeId && a.date === today);
    if (!record) {
      throw { statusCode: 404, code: "NO_CLOCK_IN_FOUND", message: "No clock-in record found for today" };
    }

    // Calculate hours worked
    const [inHours, inMins] = record.checkIn.split(":").map(Number);
    const [outHours, outMins] = timeNow.split(":").map(Number);
    let totalMinutes = outHours * 60 + outMins - (inHours * 60 + inMins);
    if (totalMinutes < 0) totalMinutes = 0;

    const hoursWorked = parseFloat((totalMinutes / 60).toFixed(2));
    const overtimeHours = hoursWorked > 8.0 ? parseFloat((hoursWorked - 8.0).toFixed(2)) : 0;

    const updated = await db.collection("attendance_records").updateById(record.id, {
      checkOut: timeNow,
      hoursWorked,
      overtimeHours,
      notes: notes || record.notes,
    });

    return updated;
  }

  static async submitAttendanceCorrection({ employeeId, date, requestedCheckIn, requestedCheckOut, reason }) {
    const correction = {
      id: generateUUID(),
      employeeId,
      date,
      requestedCheckIn,
      requestedCheckOut,
      reason,
      status: "Pending approval",
      createdAt: new Date().toISOString(),
    };

    // Auto-create workflow approval request
    await db.collection("approval_requests").insert({
      id: correction.id,
      code: `ATT-CORR-${Date.now().toString().slice(-4)}`,
      entityType: "ATTENDANCE_CORRECTION",
      title: `Attendance Correction for ${employeeId} on ${date}`,
      amountFormatted: `${requestedCheckIn} - ${requestedCheckOut}`,
      amount: 0,
      requesterName: employeeId,
      requesterId: employeeId,
      department: "Production",
      stage: "Level 1 of 1",
      assignedToRole: "mgr.production",
      status: "Pending approval",
      createdAt: new Date().toISOString(),
      history: [],
    });

    return correction;
  }

  static async getMonthlySummary(employeeId, year, month) {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    const records = await db.collection("attendance_records").find(
      (a) => a.employeeId === employeeId && a.date.startsWith(prefix)
    );

    const presentDays = records.filter((r) => r.status === "Present" || r.status === "Late").length;
    const lateDays = records.filter((r) => r.isLate).length;
    const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const totalOvertime = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    return {
      employeeId,
      year: Number(year),
      month: Number(month),
      totalRecordedDays: records.length,
      presentDays,
      lateDays,
      totalHoursWorked: parseFloat(totalHours.toFixed(1)),
      totalOvertimeHours: parseFloat(totalOvertime.toFixed(1)),
      records,
    };
  }

  // Overtime
  static async listOvertime({ employeeId, status }) {
    return db.collection("overtime_requests").find((o) => {
      if (employeeId && o.employeeId !== employeeId) return false;
      if (status && o.status.toLowerCase() !== status.toLowerCase()) return false;
      return true;
    });
  }

  static async requestOvertime(data) {
    const code = generateCode("OT");
    const request = {
      id: code,
      employeeId: data.employeeId,
      date: data.date,
      hours: data.hours,
      reason: data.reason,
      status: "Pending approval",
      approvedBy: null,
    };

    const created = await db.collection("overtime_requests").insert(request);

    // Link into approval requests
    await db.collection("approval_requests").insert({
      id: code,
      code,
      entityType: "OVERTIME",
      title: `Overtime Request ${code}: ${data.hours} hrs on ${data.date}`,
      amountFormatted: `${data.hours} Hours OT`,
      amount: data.hours,
      requesterName: data.employeeId,
      requesterId: data.employeeId,
      department: "Production",
      stage: "Level 1 of 1",
      assignedToRole: "mgr.production",
      status: "Pending approval",
      createdAt: new Date().toISOString(),
      history: [],
    });

    return created;
  }
}

