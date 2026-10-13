import { db } from "../config/database.js";
import { generateCode, generateUUID } from "../utils/idGenerator.js";

export class LeaveService {
  static async listLeaveTypes() {
    return db.collection("leave_types").find();
  }

  static async getLeaveBalances(employeeId) {
    return db.collection("leave_balances").find((lb) => lb.employeeId === employeeId);
  }

  static async listLeaveRequests({ employeeId, status }) {
    return db.collection("leave_requests").find((lr) => {
      if (employeeId && lr.employeeId !== employeeId) return false;
      if (status && lr.status.toLowerCase() !== status.toLowerCase()) return false;
      return true;
    });
  }

  static async applyLeave({ employeeId, leaveTypeCode, startDate, endDate, reason }) {
    // 1. Calculate duration (days count)
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      throw { statusCode: 400, code: "INVALID_DATE_RANGE", message: "End date cannot be prior to start date" };
    }
    const diffTime = Math.abs(end - start);
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 2. Validate overlapping leaves for this employee
    const existingOverlaps = await db.collection("leave_requests").find((lr) => {
      if (lr.employeeId !== employeeId || lr.status === "Cancelled" || lr.status === "Rejected") return false;
      return (
        (startDate >= lr.startDate && startDate <= lr.endDate) ||
        (endDate >= lr.startDate && endDate <= lr.endDate) ||
        (startDate <= lr.startDate && endDate >= lr.endDate)
      );
    });

    if (existingOverlaps.length > 0) {
      throw {
        statusCode: 409,
        code: "OVERLAPPING_LEAVE",
        message: `Leave dates overlap with existing leave request ${existingOverlaps[0].id}`,
      };
    }

    // 3. Verify and deduct pending balance if paid leave
    const leaveType = await db.collection("leave_types").findOne((lt) => lt.code === leaveTypeCode);
    if (!leaveType) {
      throw { statusCode: 404, code: "INVALID_LEAVE_TYPE", message: `Leave type ${leaveTypeCode} not found` };
    }

    if (leaveType.paid) {
      const balanceRec = await db.collection("leave_balances").findOne(
        (lb) => lb.employeeId === employeeId && lb.leaveTypeCode === leaveTypeCode
      );
      if (!balanceRec || balanceRec.balance < daysCount) {
        throw {
          statusCode: 400,
          code: "INSUFFICIENT_LEAVE_BALANCE",
          message: `Insufficient leave balance for ${leaveTypeCode}. Available: ${balanceRec ? balanceRec.balance : 0}, requested: ${daysCount}`,
        };
      }

      // Mark as pending in balance
      await db.collection("leave_balances").updateById(balanceRec.id, {
        pending: (balanceRec.pending || 0) + daysCount,
        balance: balanceRec.balance - daysCount,
      });
    }

    // Lookup employee for manager routing
    const employee = await db.collection("employees").findById(employeeId);
    const code = generateCode("LEV");

    const leaveRequest = {
      id: code,
      employeeId,
      employeeName: employee ? employee.fullName : employeeId,
      leaveTypeCode,
      startDate,
      endDate,
      daysCount,
      reason: reason || "",
      status: "Pending approval",
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
    };

    const created = await db.collection("leave_requests").insert(leaveRequest);

    // Create approval workflow
    await db.collection("approval_requests").insert({
      id: code,
      code,
      entityType: "LEAVE",
      title: `Leave Request ${code}: ${leaveTypeCode} (${daysCount} days)`,
      amountFormatted: `${daysCount} Days`,
      amount: daysCount,
      requesterName: employee ? employee.fullName : employeeId,
      requesterId: employeeId,
      department: employee ? employee.department : "Production",
      stage: "Level 1 of 1",
      assignedToRole: "mgr.production",
      status: "Pending approval",
      createdAt: new Date().toISOString(),
      history: [
        { level: 1, approver: employee?.managerName || "Line Manager", role: "mgr.production", action: "Pending", timestamp: null, comment: null },
      ],
    });

    return created;
  }

  static async cancelLeave(leaveId, employeeId) {
    const leave = await db.collection("leave_requests").findById(leaveId);
    if (!leave) {
      throw { statusCode: 404, code: "LEAVE_NOT_FOUND", message: "Leave request not found" };
    }
    if (leave.employeeId !== employeeId) {
      throw { statusCode: 403, code: "UNAUTHORIZED", message: "Cannot cancel another employee's leave request" };
    }
    if (leave.status === "Cancelled") {
      throw { statusCode: 400, code: "ALREADY_CANCELLED", message: "Leave request is already cancelled" };
    }

    // Restore balance if previously pending
    if (leave.status === "Pending approval") {
      const balanceRec = await db.collection("leave_balances").findOne(
        (lb) => lb.employeeId === employeeId && lb.leaveTypeCode === leave.leaveTypeCode
      );
      if (balanceRec) {
        await db.collection("leave_balances").updateById(balanceRec.id, {
          pending: Math.max(0, (balanceRec.pending || 0) - leave.daysCount),
          balance: balanceRec.balance + leave.daysCount,
        });
      }
    }

    const updated = await db.collection("leave_requests").updateById(leaveId, {
      status: "Cancelled",
    });

    // Also cancel approval request
    await db.collection("approval_requests").updateById(leaveId, {
      status: "Cancelled",
    });

    return updated;
  }
}

