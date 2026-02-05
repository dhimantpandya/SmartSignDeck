import { Server, Socket } from "socket.io";
import { type Server as HttpServer } from "http";
import { type Server as HttpsServer } from "https";
import logger from "../config/logger";

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
        socket.on("join_company", (companyId: string) => {
            socket.join(`company_${companyId}`);
            logger.info(`User ${socket.id} joined company room: company_${companyId}`);
        });

        // Join individual room for personal notifications/DMs
        socket.on("join_user", (userId: string) => {
            socket.join(`user_${userId}`);
            logger.info(`User ${socket.id} joined personal room: user_${userId}`);
        });

        // Real-time Chat Broadcast
        socket.on("send_chat", (data: {
            text: string;
            companyId?: string;
            recipientId?: string;
            senderName: string;
            senderId: string;
            avatar?: string;
        }) => {
            const { companyId, recipientId, text, senderName, senderId, avatar } = data;

            const payload = {
                text,
                senderName,
                senderId,
                avatar,
                created_at: new Date(),
            };

            if (companyId) {
                // Broadcast to entire company
                io.to(`company_${companyId}`).emit("new_chat", { ...payload, type: "company" });
            } else if (recipientId) {
                // send to recipient + sender (for sync across tabs)
                io.to(`user_${recipientId}`).emit("new_chat", { ...payload, type: "private" });
                io.to(`user_${senderId}`).emit("new_chat", { ...payload, type: "private" });
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
