/* eslint-disable no-useless-escape */
import { type NextFunction, type Request, type Response } from "express";
import httpStatus from "http-status";
import Joi, { type ObjectSchema } from "joi";
import ApiError from "../utils/ApiError";
import pick from "../utils/pick";

interface RequestSchema {
  body?: ObjectSchema;
  query?: ObjectSchema;
  params?: ObjectSchema;
}

function validate(schema: RequestSchema) {
  return function (req: Request, _res: Response, next: NextFunction) {
    const validSchema = pick(schema, ["params", "query", "body"]);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
      .prefs({ abortEarly: true })
      .validate(object);

    if (error != null) {
      const errorMessage = error.details
        .map((details) => details.message.replace(/\"/g, ""))
        .join(", ");
      throw new ApiError(httpStatus.BAD_REQUEST, errorMessage);
    }
    Object.assign(req, value);
    next();
  };
}

export default validate;
