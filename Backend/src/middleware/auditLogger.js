import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";
import { logger } from "../utils/logger.js";

export function logAuditEvent(action, entityType, getEntityIdAndDetails) {
  return async (req, res, next) => {
    // Wrap original send/json to capture when response completes successfully
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const user = req.user || { id: "anonymous", name: "System", role: "system" };
          const resolved = typeof getEntityIdAndDetails === "function" ? getEntityIdAndDetails(req, data) : {};

          const auditRecord = {
            id: generateUUID(),
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            role: user.role,
            action,
            entityType,
            entityId: resolved.entityId || req.params.id || null,
            details: resolved.details || `${action} on ${entityType}`,
            oldValue: resolved.oldValue || null,
            newValue: resolved.newValue || null,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
          };

          await db.collection("audit_logs").insert(auditRecord);
        } catch (auditErr) {
          logger.warn("Failed to record audit log", { error: auditErr.message });
        }
      }
      return originalJson(data);
    };

    next();
  };
}

