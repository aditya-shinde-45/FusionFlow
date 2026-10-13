import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";

export class OnboardingService {
  static async listTasks({ employeeId }) {
    return db.collection("onboarding_tasks").find((t) => {
      if (employeeId && t.employeeId !== employeeId) return false;
      return true;
    });
  }

  static async createTask(data) {
    return db.collection("onboarding_tasks").insert({
      id: generateUUID(),
      employeeId: data.employeeId,
      taskName: data.taskName,
      category: data.category || "General",
      required: data.required !== false,
      completed: false,
      verifiedBy: null,
    });
  }

  static async updateTask(taskId, { completed, verifiedBy }) {
    const task = await db.collection("onboarding_tasks").findById(taskId);
    if (!task) {
      throw { statusCode: 404, code: "TASK_NOT_FOUND", message: "Onboarding task not found" };
    }

    const updated = await db.collection("onboarding_tasks").updateById(taskId, {
      completed,
      verifiedBy: completed ? verifiedBy || "HR Specialist" : null,
      completedAt: completed ? new Date().toISOString() : null,
    });

    return updated;
  }
}

