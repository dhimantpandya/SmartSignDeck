import httpStatus from "http-status";
import mongoose from "mongoose";
import httpMocks from "node-mocks-http";
import winston from "winston";
import config from "../../../src/config/config";
import logger from "../../../src/config/logger";
import { errorConverter, errorHandler } from "../../../src/middleware/error";
import ApiError from "../../../src/utils/ApiError";

describe("Error middlewares", () => {
  describe("Error converter", () => {
    test("should return the same ApiError object it was called with", () => {
      const error = new ApiError(httpStatus.BAD_REQUEST, "Any error");
      const next = jest.fn();

      errorConverter(
        error,
        httpMocks.createRequest(),
        httpMocks.createResponse(),
        next,
      );

      expect(next).toHaveBeenCalledWith(error);
    });

    test("should convert an Error to ApiError and preserve its status and message", () => {
      const error: Error & Record<"statusCode", number> = Object.assign(
        new Error("Any error"),
        {
          statusCode: httpStatus.OK,
        },
      );
      error.statusCode = httpStatus.BAD_REQUEST;
      const next = jest.fn();

      errorConverter(
        error,
        httpMocks.createRequest(),
        httpMocks.createResponse(),
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: error.statusCode,
          message: error.message,
          isOperational: false,
        }),
      );
    });

    test("should convert an Error without status to ApiError with status 500", () => {
      const error = new Error("Any error");
      const next = jest.fn();

      errorConverter(
        error,
        httpMocks.createRequest(),
        httpMocks.createResponse(),
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: httpStatus.INTERNAL_SERVER_ERROR,
          message: error.message,
          isOperational: false,
        }),
      );
    });

    // test('should convert an Error without message to ApiError with default message of that http status', () => {
    //   const error: Error & Record<'statusCode', number> = Object.assign(new Error(), { statusCode: httpStatus.OK });
    //   error.statusCode = httpStatus.BAD_REQUEST;
    //   const next = jest.fn();

    //   errorConverter(error, httpMocks.createRequest(), httpMocks.createResponse(), next);

    //   expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    //   expect(next).toHaveBeenCalledWith(
    //     expect.objectContaining({
    //       statusCode: error.statusCode,
    //       message: httpStatus[error.statusCode as keyof typeof httpStatus],
    //       isOperational: false,
    //     }),
    //   );
    // });

    test("should convert a Mongoose error to ApiError with status 400 and preserve its message", () => {
      const error = new mongoose.Error("Any mongoose error");
      const next = jest.fn();

      errorConverter(
        error,
        httpMocks.createRequest(),
        httpMocks.createResponse(),
        next,
      );

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: httpStatus.BAD_REQUEST,
          message: error.message,
          isOperational: false,
        }),
      );
    });

    // test('should convert any other object to ApiError with status 500 and its message', () => {
    //   const error: ApiError = new ApiError(httpStatus.BAD_REQUEST, 'INTERNAL_SERVER_ERROR');
    //   const next = jest.fn();

    //   errorConverter(error, httpMocks.createRequest(), httpMocks.createResponse(), next);

    //   expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    //   expect(next).toHaveBeenCalledWith(
    //     expect.objectContaining({
    //       statusCode: httpStatus.INTERNAL_SERVER_ERROR,
    //       message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
    //       isOperational: false,
    //     }),
    //   );
    // });
  });

  describe("Error handler", () => {
    beforeEach(() => {
      jest.spyOn(logger, "error").mockImplementation((): winston.Logger => {
        return winston.createLogger({
          transports: [new winston.transports.Console()],
        });
      });
    });

    // test('should send proper error response and put the error message in res.locals', () => {
    //   const error = new ApiError(httpStatus.BAD_REQUEST, 'Any error');
    //   const res = httpMocks.createResponse();
    //   const next = jest.fn();
    //   const sendSpy = jest.spyOn(res, 'send');

    //   errorHandler(error, httpMocks.createRequest(), res, next);

    //   expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ status: error.statusCode, message: error.message }));
    //   expect(res.locals.errorMessage).toBe(error.message);
    // });

    test("should put the error stack in the response if in development mode", () => {
      config.env = "development";
      const error = new ApiError(httpStatus.BAD_REQUEST, "Any error");
      const res = httpMocks.createResponse();
      const next = jest.fn();
      const sendSpy = jest.spyOn(res, "send");

      errorHandler(error, httpMocks.createRequest(), res, next);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: error.statusCode,
          message: error.message,
          stack: error.stack,
          data: {},
        }),
      );
      config.env =
        process.env.NODE_ENV === undefined
          ? "development"
          : (process.env.NODE_ENV as "production" | "development" | "test");
    });

    // test('should send internal server error status and message if in production mode and error is not operational', () => {
    //   config.env = 'production';
    //   const error = new ApiError(httpStatus.BAD_REQUEST, 'Any error', false);
    //   const res = httpMocks.createResponse();
    //   const next = jest.fn();
    //   const sendSpy = jest.spyOn(res, 'send');

    //   errorHandler(error, httpMocks.createRequest(), res, next);

    //   expect(sendSpy).toHaveBeenCalledWith(
    //     expect.objectContaining({
    //       status: httpStatus.INTERNAL_SERVER_ERROR,
    //       message: httpStatus[httpStatus.INTERNAL_SERVER_ERROR],
    //     }),
    //   );
    //   expect(res.locals.errorMessage).toBe(error.message);
    //   config.env =
    //     process.env.NODE_ENV === undefined ? 'development' : (process.env.NODE_ENV as 'production' | 'development' | 'test');
    // });

    test("should preserve original error status and message if in production mode and error is operational", () => {
      config.env = "production";
      const error = new ApiError(httpStatus.BAD_REQUEST, "Any error");
      const res = httpMocks.createResponse();
      const next = jest.fn();
      const sendSpy = jest.spyOn(res, "send");

      errorHandler(error, httpMocks.createRequest(), res, next);

      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: error.statusCode,
          message: error.message,
        }),
      );
      config.env =
        process.env.NODE_ENV === undefined
          ? "development"
          : (process.env.NODE_ENV as "production" | "development" | "test");
    });
  });
});
