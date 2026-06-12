import { env } from "./env";

export const loggerConfig = {
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:mm:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
};
