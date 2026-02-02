import { type Response } from "express";

const successResponse = (
  res: Response,
  message: string,
  statusCode: number,
  data: object = {},
): void => {
  res.status(statusCode);
  res.json({
    status: "success",
    code: statusCode,
    message,
    data,
  });
};

export default successResponse;
