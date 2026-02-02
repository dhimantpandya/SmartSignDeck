import { type Request, type Response } from "express";
import morgan from "morgan";
import config from "./config";
import logger from "./logger";

morgan.token("message", (_req: Request, res: Response) => {
  const errorMessage: string | undefined = res.locals.errorMessage;
  return errorMessage !== null ? errorMessage : "";
});

const getIpFormat = (): string =>
  config.env === "production" ? ":remote-addr - " : "";

const successFormat: string = `${getIpFormat()}:method :url :status - :response-time ms`;
const errorFormat: string = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successHandler = morgan(successFormat, {
  skip: (_req: Request, res: Response) => res.statusCode >= 400,
  stream: { write: (message: string) => logger.info(message.trim()) },
});

const errorHandler = morgan(errorFormat, {
  skip: (_req: Request, res: Response) => res.statusCode < 400,
  stream: { write: (message: string) => logger.error(message.trim()) },
});

export { errorHandler, successHandler };
