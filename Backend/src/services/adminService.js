import { db } from "../config/database.js";
import { ROLES, ROLE_PERMISSIONS } from "../constants/roles.js";

export class AdminService {
  static async listUsers() {
    const users = await db.collection("users").find();
    return users.map((u) => {
      const { passwordHash, ...safeUser } = u;
      return safeUser;
    });
  }

  static async updateUserRole(userId, newRole) {
    if (!Object.values(ROLES).includes(newRole)) {
      throw { statusCode: 400, code: "INVALID_ROLE", message: `Role ${newRole} is not a valid system role` };
    }

    const updated = await db.collection("users").updateById(userId, { role: newRole });
    if (!updated) {
      throw { statusCode: 404, code: "USER_NOT_FOUND", message: "User not found" };
    }

    const { passwordHash, ...safeUser } = updated;
    return safeUser;
  }

  static async listRolesAndPermissions() {
    return {
      roles: Object.values(ROLES),
      matrix: ROLE_PERMISSIONS,
    };
  }

  static async listAuditLogs({ entityType, action, userId, limit = 50 }) {
    const logs = await db.collection("audit_logs").find((l) => {
      if (entityType && l.entityType !== entityType) return false;
      if (action && l.action !== action) return false;
      if (userId && l.userId !== userId) return false;
      return true;
    });

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return logs.slice(0, Number(limit));
  }
}

