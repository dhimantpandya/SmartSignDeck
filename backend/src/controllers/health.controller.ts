import { type Request, type Response } from "express";
import mongoose from "mongoose";
import catchAsync from "../utils/catchAsync";
import { v2 as cloudinary } from "cloudinary";
import config from "../config/config";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
}

interface HealthResponse {
  status: "OK" | "DEGRADED" | "UNHEALTHY";
  timestamp: number;
  uptime: number;
  environment: string;
  checks: {
    database: HealthCheck;
    cloudinary: HealthCheck;
    memory: HealthCheck;
  };
}

const checkDatabase = async (): Promise<HealthCheck> => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      return { status: "healthy" };
    }
    return { status: "unhealthy", message: "Database not connected" };
  } catch (error: any) {
    return { status: "unhealthy", message: error.message };
  }
};

const checkCloudinary = async (): Promise<HealthCheck> => {
  try {
    await cloudinary.api.ping();
    return { status: "healthy" };
  } catch (error: any) {
    return { status: "degraded", message: "Cloudinary unreachable" };
  }
};

const checkMemory = (): HealthCheck => {
  const memUsage = process.memoryUsage();
  // Use heap_size_limit (the maximum memory V8 will use) instead of heapTotal (current allocated size)
  // to avoid false positives on small, newly allocated heaps.
  const v8 = require("v8");
  const heapLimit = v8.getHeapStatistics().heap_size_limit;
  const heapUsedPercent = (memUsage.heapUsed / heapLimit) * 100;

  if (heapUsedPercent > 95) {
    return {
      status: "unhealthy",
      message: `Memory usage critical: ${heapUsedPercent.toFixed(2)}% of limit`,
    };
  } else if (heapUsedPercent > 85) {
    return {
      status: "degraded",
      message: `Memory usage high: ${heapUsedPercent.toFixed(2)}% of limit`,
    };
  }
  return { status: "healthy" };
};

const getHealth = catchAsync(async (req: Request, res: Response) => {
  const [database, cloudinaryCheck, memory] = await Promise.all([
    checkDatabase(),
    checkCloudinary(),
    checkMemory(),
  ]);

  const checks = { database, cloudinary: cloudinaryCheck, memory };

  // Determine overall status
  let overallStatus: "OK" | "DEGRADED" | "UNHEALTHY" = "OK";

  if (Object.values(checks).some((check) => check.status === "unhealthy")) {
    overallStatus = "UNHEALTHY";
  } else if (
    Object.values(checks).some((check) => check.status === "degraded")
  ) {
    overallStatus = "DEGRADED";
  }

  const health: HealthResponse = {
    status: overallStatus,
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: config.env,
    checks,
  };

  const statusCode =
    overallStatus === "OK" ? 200 : overallStatus === "DEGRADED" ? 200 : 503;
  res.status(statusCode).json(health);
});

const getReadiness = catchAsync(async (req: Request, res: Response) => {
  const dbCheck = await checkDatabase();

  if (dbCheck.status === "healthy") {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: dbCheck.message });
  }
});

const getLiveness = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json({ alive: true, timestamp: Date.now() });
});

export default {
  getHealth,
  getReadiness,
  getLiveness,
};
