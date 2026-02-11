import express from "express";
import auth from "../../middleware/auth";
import notificationService from "../../services/notification.service";
import httpStatus from "http-status";

const router = express.Router();

router.get("/", auth(), async (req, res) => {
    const notifications = await notificationService.getUserNotifications(req.user!.id);
    const unreadCount = await notificationService.getUnreadCount(req.user!.id);
    res.send({ notifications, unreadCount });
});

router.patch("/:notificationId/read", auth(), async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.notificationId);
    res.send(notification);
});

router.patch("/read-all", auth(), async (req, res) => {
    await notificationService.markAllAsRead(req.user!.id);
    res.status(httpStatus.NO_CONTENT).send();
});

router.patch("/clear-chat", auth(), async (req, res) => {
    const { type, senderId } = req.body;
    await notificationService.markChatAsRead(req.user!.id, type, senderId);
    res.status(httpStatus.NO_CONTENT).send();
});

export default router;
