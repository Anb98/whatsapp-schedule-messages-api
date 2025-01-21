import { createLogger, format, transports, config } from "winston";

const myFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.printf(
    (info) => `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`
  )
);

const loggerInstance = createLogger({
  levels: config.syslog.levels,
  format: myFormat,
  transports: [new transports.Console()],
});

export const loggerLevels = {
  error: "error",
  warn: "warn",
  info: "info",
  http: "http",
  verbose: "verbose",
  debug: "debug",
  silly: "silly",
} as const;

export default loggerInstance;
