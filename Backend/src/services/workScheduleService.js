import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";

export class WorkScheduleService {
  static async listShifts() {
    return db.collection("shifts").find();
  }

  static async createShift(data) {
    return db.collection("shifts").insert({
      id: generateUUID(),
      code: data.code,
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      breakDurationMinutes: data.breakDurationMinutes || 45,
    });
  }

  static async requestShiftSwap({ employeeId, targetEmployeeId, originalDate, targetDate, reason }) {
    const swapRequest = {
      id: generateUUID(),
      employeeId,
      targetEmployeeId,
      originalDate,
      targetDate,
      reason,
      status: "Pending approval",
      createdAt: new Date().toISOString(),
    };

    // Auto-create approval request
    await db.collection("approval_requests").insert({
      id: swapRequest.id,
      code: `SWAP-${Date.now().toString().slice(-4)}`,
      entityType: "SHIFT_SWAP",
      title: `Shift Swap Request: ${employeeId} with ${targetEmployeeId}`,
      amountFormatted: "Shift Swap",
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

    return swapRequest;
  }
}

