import { Server, Socket } from "socket.io";
import { type Server as HttpServer } from "http";
import { type Server as HttpsServer } from "https";
import logger from "../config/logger";

let io: Server;

const cleanId = (id: any): string => {
    if (!id) return "";
    if (typeof id === 'string') return id.trim().toLowerCase();
    // Handle mongoose ObjectId or generic object with id/_id
    const extracted = id._id || id.id || id;
    return extracted.toString().trim().toLowerCase();
};

const initSocket = (server: HttpServer | HttpsServer): Server => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // Track online users: userId -> Set<socketId>
    const onlineUsers = new Map<string, Set<string>>();

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
            if (!cid) {
                logger.warn(`[SOCKET] ⚠️ Socket ${socket.id} tried to join invalid company. Raw: ${companyId}`);
                return;
            }
            const roomName = `company_${cid}`;
            socket.join(roomName);
            logger.info(`[SOCKET] ✅ Socket ${socket.id} joined company room: "${roomName}" | Raw ID: ${JSON.stringify(companyId)} | Cleaned: ${cid}`);

            // Emit confirmation back to client
            socket.emit('room_joined', { room: roomName, companyId: cid });

            // Send current list of online users in this company (basic implementation)
            // In a real app, we'd filter this list by companyId, but for now we rely on the client to filter by known ids
            const onlineUserIds = Array.from(onlineUsers.keys());
            socket.emit('online_users_update', onlineUserIds);
        });

        // Join individual room for personal notifications/DMs AND track presence
        socket.on("join_user", (userId: any) => {
            const uid = cleanId(userId);
            if (!uid) return;

            socket.join(`user_${uid}`);
            logger.info(`[SOCKET] Socket ${socket.id} joined personal room: ${uid}`);

            // Track presence
            if (!onlineUsers.has(uid)) {
                onlineUsers.set(uid, new Set());
                // Notify everyone this user is now online
                io.emit('user_status_change', { userId: uid, status: 'online' });
            }
            onlineUsers.get(uid)?.add(socket.id);

            // Store userId on socket instance for disconnect handling
            (socket as any).userId = uid;

            socket.emit('room_joined', { room: `user_${uid}`, userId: uid });
        });

        // --- TEMPLATE COLLABORATION ---
        socket.on("join_template", (templateId: any) => {
            const tid = cleanId(templateId);
            if (!tid) return;
            socket.join(`template_${tid}`);
            logger.info(`[SOCKET] Socket ${socket.id} joined template room: template_${tid}`);
        });

        socket.on("template_edit", (data: { templateId: any, [key: string]: any }) => {
            const tid = cleanId(data.templateId);
            if (!tid) return;
            // Broadcast to others in the same template room
            socket.to(`template_${tid}`).emit("template_updated", data);
            logger.info(`[SOCKET] Template update broadcast to room template_${tid}`);
        });

        socket.on("disconnect", () => {
            logger.info(`Client disconnected: ${socket.id}`);

            const uid = (socket as any).userId;
            if (uid && onlineUsers.has(uid)) {
                const userSockets = onlineUsers.get(uid);
                userSockets?.delete(socket.id);

                if (userSockets?.size === 0) {
                    onlineUsers.delete(uid);
                    // Notify everyone this user is now offline
                    io.emit('user_status_change', { userId: uid, status: 'offline' });
                }
            }
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
    if (!io) {
        logger.error("[SOCKET] broadcastChat called but IO not initialized!");
        return;
    }

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
        const roomName = `company_${companyId}`;
        const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
        const socketCount = socketsInRoom ? socketsInRoom.size : 0;
        logger.info(`[SOCKET] 📢 Broadcasting company chat to room "${roomName}" | Sockets in room: ${socketCount} | Sender: ${senderId} | Raw companyId: ${JSON.stringify(data.companyId)} | Cleaned: ${companyId}`);
        io.to(roomName).emit("new_chat", { ...payload, type: "company", companyId });
        logger.info(`[SOCKET] ✅ Company message broadcast complete`);
    } else if (recipientId) {
        logger.info(`[SOCKET] Broadcasting private chat from ${senderId} to ${recipientId}`);
        const privatePayload = { ...payload, type: "private", recipientId, senderId };
        io.to(`user_${recipientId}`).emit("new_chat", privatePayload);
        io.to(`user_${senderId}`).emit("new_chat", privatePayload);
    }
}

const emitToTemplate = (templateId: string, event: string, data: any) => {
    if (io) {
        const tid = cleanId(templateId);
        io.to(`template_${tid}`).emit(event, data);
    }
}

export { initSocket, getIO, emitToScreen, emitToUser, emitToCompany, emitToTemplate, broadcastChat, cleanId };
