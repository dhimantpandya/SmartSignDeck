import http from "http";
import type https from "https";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import config from "./config/config";
import app from "./app";
import logger from "./config/logger";
import { initSocket } from "./services/socket.service";
import triggerService from "./services/trigger.service";
import cleanupService from "./services/cleanup.service";

let server: http.Server | https.Server;

// Connect to MongoDB
mongoose
  .connect(config.mongoose.url, { dbName: config.mongoose.dbName })
  .then(() => {
    logger.info("Connected to MongoDB");
    console.log("Using database:", mongoose.connection.db.databaseName);

    // Start HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    initSocket(httpServer);

    httpServer.listen(config.port, () => {
      logger.info(`HTTP Server running on port ${config.port}`);
      triggerService.startPolling();
      cleanupService.startCleanupJob();
    });
    server = httpServer;
  })
  .catch((error) => {
    logger.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: true,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((err, success) => {
  if (err) console.error("Email server connection failed:", err);
  else console.log("Email server is ready to send messages");
});

export { transporter };

// Graceful shutdown
const exitHandler = (): void => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      mongoose.connection.close(false).then(() => {
        logger.info("Mongoose connection closed");
        process.exit(0);
      });
    });

    // Force exit if graceful shutdown takes too long (e.g. 10s)
    setTimeout(() => {
      logger.error(
        "Could not close connections in time, forcefully shutting down",
      );
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

const unexpectedErrorHandler = (error: Error): void => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  exitHandler();
});

process.on("SIGINT", () => {
  logger.info("SIGINT received");
  exitHandler();
});
