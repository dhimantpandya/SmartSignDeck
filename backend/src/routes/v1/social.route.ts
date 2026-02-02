import express from "express";
import auth from "../../middleware/auth";
import socialController from "../../controllers/social.controller";

const router = express.Router();

// Chat
router.post("/message", auth(), socialController.sendMessage);
router.get("/board", auth(), socialController.getCompanyBoard);
router.get("/chat/:recipientId", auth(), socialController.getChatHistory);

// Friends
router.get("/friends", auth(), socialController.getFriends);
router.post("/friends/request", auth(), socialController.sendFriendRequest);
router.get("/friends/requests/sent", auth(), socialController.getSentRequests);
router.get("/friends/requests/received", auth(), socialController.getPendingRequests);
router.post("/friends/request/:requestId", auth(), socialController.respondToFriendRequest);

export default router;
