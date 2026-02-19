import express from "express";
import auth from "../../middleware/auth";
import notificationService from "../../services/notification.service";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";

const router = express.Router();

router.get("/", auth(), catchAsync(async (req, res) => {
    const userId = req.user!._id || req.user!.id;
    const notifications = await notificationService.getUserNotifications(userId);
    const unreadCount = await notificationService.getUnreadCount(userId);
    res.send({ notifications, unreadCount });
}));

router.patch("/:notificationId/read", auth(), catchAsync(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.notificationId);
    res.send(notification);
}));

router.patch("/read-all", auth(), catchAsync(async (req, res) => {
    const userId = req.user!._id || req.user!.id;
    await notificationService.markAllAsRead(userId);
    res.status(httpStatus.NO_CONTENT).send();
}));

router.patch("/clear-chat", auth(), catchAsync(async (req, res) => {
    const { type, senderId } = req.body;
    const userId = req.user!._id || req.user!.id;
    await notificationService.markChatAsRead(userId, type, senderId);
    res.status(httpStatus.NO_CONTENT).send();
}));

export default router;

