import { NotificationService } from "../services/notificationService.js";
import { successResponse } from "../utils/response.js";

export class NotificationController {
  static async list(req, res, next) {
    try {
      const data = await NotificationService.listUserNotifications(req.user.id);
      return successResponse(res, { data, message: "Notifications retrieved" });
    } catch (err) {
      next(err);
    }
  }

  static async markRead(req, res, next) {
    try {
      const data = await NotificationService.markAsRead(req.params.id, req.user.id);
      return successResponse(res, { data, message: "Notification marked as read" });
    } catch (err) {
      next(err);
    }
  }

  static async markAllRead(req, res, next) {
    try {
      const data = await NotificationService.markAllAsRead(req.user.id);
      return successResponse(res, { data, message: "All notifications marked as read" });
    } catch (err) {
      next(err);
    }
  }
}

