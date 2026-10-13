import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";
import { EmployeeService } from "./employeeService.js";

export class ApprovalService {
  static async listApprovals({ assignedRole, status, requesterId }) {
    return db.collection("approval_requests").find((req) => {
      if (assignedRole && req.assignedToRole !== assignedRole) return false;
      if (status && req.status.toLowerCase() !== status.toLowerCase()) return false;
      if (requesterId && req.requesterId !== requesterId) return false;
      return true;
    });
  }

  static async getApprovalById(id) {
    const req = await db.collection("approval_requests").findOne((r) => r.id === id || r.code === id);
    if (!req) {
      throw { statusCode: 404, code: "APPROVAL_REQUEST_NOT_FOUND", message: `Approval request not found: ${id}` };
    }
    return req;
  }

  static async actOnApproval(id, { action, comment, reassignedToRole, requestedInfoMessage }, user) {
    const req = await db.collection("approval_requests").findOne((r) => r.id === id || r.code === id);
    if (!req) {
      throw { statusCode: 404, code: "APPROVAL_REQUEST_NOT_FOUND", message: "Approval request not found" };
    }

    // Validate current status
    if (["Approved", "Rejected", "Cancelled"].includes(req.status)) {
      throw {
        statusCode: 400,
        code: "INVALID_STATUS_TRANSITION",
        message: `Cannot perform '${action}' on already finalized request (current status: ${req.status})`,
      };
    }

    // Role check: User must have matching role or be admin
    if (user.role !== "admin" && req.assignedToRole && req.assignedToRole !== user.role) {
      throw {
        statusCode: 403,
        code: "UNAUTHORIZED_APPROVER",
        message: `This approval is assigned to '${req.assignedToRole}', but your role is '${user.role}'`,
      };
    }

    // Rejection requires comment/reason
    if (action === "Rejected" && (!comment || !comment.trim())) {
      throw {
        statusCode: 400,
        code: "REJECTION_REASON_REQUIRED",
        message: "A rejection reason is required to reject an approval request",
      };
    }

    const historyEntry = {
      approver: user.name,
      role: user.role,
      action,
      comment: comment || requestedInfoMessage || "",
      timestamp: new Date().toISOString(),
    };

    let newStatus = req.status;
    let newAssignedRole = req.assignedToRole;

    if (action === "Approved") {
      newStatus = "Approved";
      // Execute side-effects on the underlying entity!
      await ApprovalService.executeApprovalSideEffects(req, user);
    } else if (action === "Rejected") {
      newStatus = "Rejected";
      await ApprovalService.executeRejectionSideEffects(req, comment);
    } else if (action === "Information requested") {
      newStatus = "Information requested";
    } else if (action === "Reassigned") {
      newStatus = "Pending approval";
      newAssignedRole = reassignedToRole || req.assignedToRole;
    }

    const history = [...(req.history || []), historyEntry];

    const updated = await db.collection("approval_requests").updateById(req.id, {
      status: newStatus,
      assignedToRole: newAssignedRole,
      history,
    });

    // Notify requester
    const requesterUser = await db.collection("users").findOne((u) => u.name === req.requesterName);
    if (requesterUser) {
      await db.collection("notifications").insert({
        id: generateUUID(),
        userId: requesterUser.id,
        type: "APPROVAL",
        title: `${req.entityType} ${action.toLowerCase()}`,
        message: `Your request ${req.title} was ${action.toLowerCase()} by ${user.name}.`,
        unread: true,
        createdAt: new Date().toISOString(),
        link: "/worklist",
      });
    }

    return updated;
  }

  // Cross-module state synchronization when approval happens
  static async executeApprovalSideEffects(approvalReq, user) {
    const { entityType, id } = approvalReq;

    if (entityType === "LEAVE") {
      const leave = await db.collection("leave_requests").findById(id);
      if (leave) {
        await db.collection("leave_requests").updateById(id, {
          status: "Approved",
          approvedBy: user.name,
          approvedAt: new Date().toISOString(),
        });
        // Deduct from used balance
        const balanceRec = await db.collection("leave_balances").findOne(
          (lb) => lb.employeeId === leave.employeeId && lb.leaveTypeCode === leave.leaveTypeCode
        );
        if (balanceRec) {
          await db.collection("leave_balances").updateById(balanceRec.id, {
            pending: Math.max(0, (balanceRec.pending || 0) - leave.daysCount),
            used: (balanceRec.used || 0) + leave.daysCount,
          });
        }
      }
    } else if (entityType === "OVERTIME") {
      await db.collection("overtime_requests").updateById(id, {
        status: "Approved",
        approvedBy: user.name,
      });
    } else if (entityType === "ATTENDANCE_CORRECTION") {
      // Apply attendance correction
      const att = await db.collection("attendance_records").findOne((a) => a.id === id);
      if (att) {
        await db.collection("attendance_records").updateById(id, {
          status: "Corrected",
        });
      }
    } else if (entityType === "REQUISITION") {
      await db.collection("job_requisitions").updateById(id, {
        status: "Open",
      });
    } else if (entityType === "SALARY_REVISION") {
      // Activate new compensation record and archive previous
      const rev = await db.collection("compensation_records").findById(id);
      if (rev) {
        await db.collection("compensation_records").update(
          (c) => c.employeeId === rev.employeeId && c.id !== id && c.status === "Active",
          { status: "Superseded" }
        );
        await db.collection("compensation_records").updateById(id, {
          status: "Active",
        });
      }
    } else if (entityType === "EMPLOYMENT_ACTION") {
      // Mark as processed
    }
  }

  static async executeRejectionSideEffects(approvalReq, reason) {
    const { entityType, id } = approvalReq;

    if (entityType === "LEAVE") {
      const leave = await db.collection("leave_requests").findById(id);
      if (leave) {
        await db.collection("leave_requests").updateById(id, {
          status: "Rejected",
          rejectionReason: reason,
        });
        // Restore balance
        const balanceRec = await db.collection("leave_balances").findOne(
          (lb) => lb.employeeId === leave.employeeId && lb.leaveTypeCode === leave.leaveTypeCode
        );
        if (balanceRec) {
          await db.collection("leave_balances").updateById(balanceRec.id, {
            pending: Math.max(0, (balanceRec.pending || 0) - leave.daysCount),
            balance: balanceRec.balance + leave.daysCount,
          });
        }
      }
    } else if (entityType === "OVERTIME") {
      await db.collection("overtime_requests").updateById(id, { status: "Rejected" });
    }
  }

  static async listRules() {
    return db.collection("approval_rules").find();
  }
}

