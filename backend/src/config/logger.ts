import winston, { format, transports, type Logger } from "winston";
import config from "./config";

const enumerateErrorFormat = format(
  (info: winston.Logform.TransformableInfo) => {
    if (info instanceof Error) {
      Object.assign(info, { message: info.stack });
    }
    return info;
  },
);

const logger: Logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    enumerateErrorFormat(),
    config.env === "development"
      ? format.combine(
          format.colorize(),
          format.printf(
            ({ timestamp, level, message }) =>
              `${timestamp} ${level}: ${message}`,
          ),
        )
      : format.combine(format.json(), format.metadata()),
  ),
  transports: [
    new transports.Console({
      stderrLevels: ["error"],
    }),
    // File transport for errors
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

export default logger;
