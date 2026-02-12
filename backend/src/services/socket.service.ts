import { Server, Socket } from "socket.io";
import { type Server as HttpServer } from "http";
import { type Server as HttpsServer } from "https";
import logger from "../config/logger";

let io: Server;

const cleanId = (id: any): string => {
    if (!id) return "";
    return id.toString().trim().toLowerCase();
};

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
            const cid = cleanId(companyId);
            if (!cid) return;
            socket.join(`company_${cid}`);
            logger.info(`[SOCKET] Socket ${socket.id} joined company: ${cid}`);
        });

        // Join individual room for personal notifications/DMs
        socket.on("join_user", (userId: any) => {
            const uid = cleanId(userId);
            if (!uid) return;
            socket.join(`user_${uid}`);
            logger.info(`[SOCKET] Socket ${socket.id} joined personal room: ${uid}`);
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

/**
 * Helper to emit event to a specific user room
 */
const emitToUser = (userId: string, event: string, payload: any) => {
    if (io) {
        const uid = userId.toString().trim().toLowerCase();
        io.to(`user_${uid}`).emit(event, payload);
    }
}

const emitToCompany = (companyId: string, event: string, data: any) => {
    if (io) {
        io.to(`company_${companyId}`).emit(event, data);
    }
}

const broadcastChat = (data: {
    text: string;
    companyId?: any;
    recipientId?: any;
    senderName: string;
    senderId: any;
    avatar?: string;
    created_at?: Date;
}) => {
    if (!io) return;

    const companyId = cleanId(data.companyId);
    const recipientId = cleanId(data.recipientId);
    const senderId = cleanId(data.senderId);
    const { text, senderName, avatar, created_at } = data;

    const payload = {
        text,
        senderName,
        senderId,
        avatar,
        created_at: created_at || new Date(),
    };

    if (companyId) {
        logger.info(`[SOCKET] Broadcasting company chat to company_${companyId}`);
        io.to(`company_${companyId}`).emit("new_chat", { ...payload, type: "company", companyId });
    } else if (recipientId) {
        logger.info(`[SOCKET] Broadcasting private chat from ${senderId} to ${recipientId}`);
        const privatePayload = { ...payload, type: "private", recipientId, senderId };
        io.to(`user_${recipientId}`).emit("new_chat", privatePayload);
        io.to(`user_${senderId}`).emit("new_chat", privatePayload);
    }
}

export { initSocket, getIO, emitToScreen, emitToUser, emitToCompany, broadcastChat, cleanId };
