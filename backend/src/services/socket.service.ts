import { Server, Socket } from "socket.io";
import { type Server as HttpServer } from "http";
import { type Server as HttpsServer } from "https";
import logger from "../config/logger";
import notificationService from "./notification.service";

let io: Server;

const initSocket = (server: HttpServer | HttpsServer): Server => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket: Socket) => {
        logger.info(`New client connected: ${socket.id}`);

        // --- SIGNAGE ROOMS ---
        socket.on("join_screen", (screenId: string) => {
            socket.join(`screen_${screenId}`);
            logger.info(`Socket ${socket.id} joined screen room: screen_${screenId}`);
        });

        // --- SOCIAL ROOMS ---
        // Join organization room for company chat
        socket.on("join_company", (companyId: any) => {
            if (!companyId) return;
            const cid = companyId.toString();
            socket.join(`company_${cid}`);
            logger.info(`[SOCKET] Socket ${socket.id} joined company: ${cid}`);
        });

        // Join individual room for personal notifications/DMs
        socket.on("join_user", (userId: any) => {
            if (!userId) return;
            const uid = userId.toString();
            socket.join(`user_${uid}`);
            logger.info(`[SOCKET] Socket ${socket.id} joined personal room: ${uid}`);
        });

        // Real-time Chat Broadcast
        socket.on("send_chat", (data: {
            text: string;
            companyId?: any;
            recipientId?: any;
            senderName: string;
            senderId: any;
            avatar?: string;
        }) => {
            // Force everything to string to prevent comparison failures
            const companyId = data.companyId ? data.companyId.toString() : undefined;
            const recipientId = data.recipientId ? data.recipientId.toString() : undefined;
            const senderId = data.senderId ? data.senderId.toString() : undefined;
            const { text, senderName, avatar } = data;

            logger.info(`[SOCKET] send_chat from ${senderId} to ${recipientId || companyId} (type: ${companyId ? 'company' : 'private'})`);

            const payload = {
                text,
                senderName,
                senderId,
                avatar,
                created_at: new Date(),
            };

            if (companyId) {
                // Broadcast to entire company
                io.to(`company_${companyId}`).emit("new_chat", { ...payload, type: "company", companyId });
            } else if (recipientId) {
                // send to recipient + sender (for sync across tabs)
                logger.info(`[SOCKET] Emitting new_chat/new_notification to user accounts: ${recipientId}, ${senderId}`);

                const privatePayload = { ...payload, type: "private", recipientId, senderId };

                // 1. Emit the actual message event
                io.to(`user_${recipientId}`).emit("new_chat", privatePayload);
                io.to(`user_${senderId}`).emit("new_chat", privatePayload);

                // 2. PERSIST & EMIT NOTIFICATION for recipient (for badges/toasts)
                notificationService.createNotification(
                    recipientId,
                    "new_chat",
                    senderName,
                    text.substring(0, 50) + (text.length > 50 ? "..." : ""),
                    senderId,
                    { chatId: senderId } // For redirection
                ).then(notif => {
                    io.to(`user_${recipientId}`).emit("new_notification", notif);
                }).catch(err => logger.error(`[SOCKET] Notification failed: ${err.message}`));
            }
        });

        socket.on("disconnect", () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = (): Server => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const emitToScreen = (screenId: string, event: string, data: any) => {
    if (io) {
        io.to(`screen_${screenId}`).emit(event, data);
    }
};

const emitToUser = (userId: string, event: string, data: any) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
}

const emitToCompany = (companyId: string, event: string, data: any) => {
    if (io) {
        io.to(`company_${companyId}`).emit(event, data);
    }
}

export { initSocket, getIO, emitToScreen, emitToUser, emitToCompany };
