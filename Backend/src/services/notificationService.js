import { db } from "../config/database.js";
import { generateUUID } from "../utils/idGenerator.js";

export class NotificationService {
  static async listUserNotifications(userId) {
    const notifications = await db.collection("notifications").find((n) => n.userId === userId);
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unreadCount = notifications.filter((n) => n.unread).length;
    return {
      unreadCount,
      notifications,
    };
  }

  static async markAsRead(notificationId, userId) {
    return db.collection("notifications").update(
      (n) => n.id === notificationId && n.userId === userId,
      { unread: false }
    );
  }

  static async markAllAsRead(userId) {
    const notifications = await db.collection("notifications").find((n) => n.userId === userId);
    for (const n of notifications) {
      await db.collection("notifications").updateById(n.id, { unread: false });
    }
    return { success: true, count: notifications.length };
  }

  static async createNotification({ userId, type, title, message, link }) {
    return db.collection("notifications").insert({
      id: generateUUID(),
      userId,
      type: type || "INFO",
      title,
      message,
      unread: true,
      createdAt: new Date().toISOString(),
      link: link || "/home",
    });
  }
}

