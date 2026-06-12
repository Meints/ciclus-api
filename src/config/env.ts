import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.coerce.number().default(3333),

    DATABASE_URL: z.url(),
    DIRECT_URL: z.url(),

    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),

    JWT_EXPIRES_IN: z.coerce.number().default(60 * 60 * 24), // 1 dia

    COOKIE_SECRET: z
      .string()
      .min(32, "COOKIE_SECRET deve ter pelo menos 32 caracteres"),

    CORS_ORIGIN: z.url(),

    RATE_LIMIT_MAX: z.coerce.number().default(100),

    RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60 * 1000), // 1 minuto

    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .default("info"),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
