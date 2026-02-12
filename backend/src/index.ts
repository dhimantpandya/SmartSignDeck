import http from "http";
import type https from "https";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import config from "./config/config";
import app from "./app";
import logger from "./config/logger";
import { initSocket } from "./services/socket.service";
import cleanupService from "./services/cleanup.service";

let server: http.Server | https.Server;

// Connect to MongoDB
mongoose
  .connect(config.mongoose.url, { dbName: config.mongoose.dbName })
  .then(async () => {
    logger.info("Connected to MongoDB");
    console.log("Using database:", mongoose.connection.db.databaseName);

    // --- AUTO SEED: Setup default admin and connections ---
    try {
      const { seedService } = await import("./services");
      await seedService.setupDefaultAdmin();
    } catch (seedErr) {
      logger.error("Seeding failed", seedErr);
    }
    // -----------------------------------------------------

    // --- MIGRATION: Drop unique company name index ---
    try {
      if (mongoose.connection.db) {
        const collection = mongoose.connection.db.collection('companies');
        const indexExists = await collection.indexExists('name_1');
        if (indexExists) {
          await collection.dropIndex('name_1');
          logger.info("Dropped unique index 'name_1' from companies collection");
        }
      }
    } catch (err: any) {
      // Ignore if index doesn't exist
      if (err.code !== 27) {
        logger.error("Failed to drop name_1 index", err);
      }
    }
    // -------------------------------------------------

    // Start HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    initSocket(httpServer);

    httpServer.listen(config.port, "0.0.0.0", () => {
      logger.info(`HTTP Server running on port ${config.port}`);
      cleanupService.startCleanupJob();
    });
    server = httpServer;
  })
  .catch((error) => {
    logger.error("Failed to connect to MongoDB", error);
    process.exit(1);
  });

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
