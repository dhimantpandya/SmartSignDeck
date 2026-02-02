import { type NextFunction, type Request, type Response } from "express";
import httpStatus from "http-status";
import mongoose from "mongoose";
import config from "../config/config";
import logger from "../config/logger";
import ApiError from "../utils/ApiError";

const errorConverter = (
  err: Error,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  let error = err;
  if (!(error instanceof ApiError)) {
    let statusCode: number =
      error instanceof mongoose.Error
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR;
    if ("statusCode" in error) {
      statusCode = error.statusCode as number;
    }
    const message = error.message.length > 0 ? error.message : "";
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): Response<unknown, Record<string, unknown>> => {
  if (err instanceof ApiError) {
    let { statusCode, message } = err;
    if (config.env === "production" && !err.isOperational) {
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR as 500];
    }

    const response = {
      status: statusCode,
      message,
      ...(config.env === "development" && { stack: err.stack }),
      data: {},
    };

    if (config.env === "development") {
      logger.error(err);
    }
    return res.status(statusCode).send(response);
  }
  return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
    status: httpStatus.INTERNAL_SERVER_ERROR,
    message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
  });
};

export { errorConverter, errorHandler };
