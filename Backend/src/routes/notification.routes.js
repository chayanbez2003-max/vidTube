import { Router } from "express";
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All notification routes require authentication
router.use(verifyJWT);

// GET /api/v1/notifications          - Get all notifications (paginated)
router.route("/").get(getNotifications);

// GET /api/v1/notifications/unread   - Get unread count
router.route("/unread").get(getUnreadCount);

// PATCH /api/v1/notifications/read-all  - Mark all as read
router.route("/read-all").patch(markAllAsRead);

// DELETE /api/v1/notifications/clear    - Clear all notifications
router.route("/clear").delete(clearAllNotifications);

// PATCH /api/v1/notifications/:notificationId/read  - Mark one as read
router.route("/:notificationId/read").patch(markAsRead);

// DELETE /api/v1/notifications/:notificationId      - Delete one notification
router.route("/:notificationId").delete(deleteNotification);

export default router;
