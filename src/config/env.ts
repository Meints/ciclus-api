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

    JWT_EXPIRES_IN: z.coerce.number().default(60 * 60 * 24 * 7), // 7 dias

    COOKIE_SECRET: z
      .string()
      .min(32, "COOKIE_SECRET deve ter pelo menos 32 caracteres"),

    CORS_ORIGIN: z.url(),

    RATE_LIMIT_MAX: z.coerce.number().default(100),

    RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60 * 1000), // 1 minuto

    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error", "fatal"])
      .default("info"),

    FRONTEND_URL: z.string().default("http://localhost:3000"),

    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default("ciclus-uploads"),

    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default("noreply@ciclus.app"),

    ZAPI_INSTANCE_ID: z.string().optional(),
    ZAPI_TOKEN: z.string().optional(),
    ZAPI_BASE_URL: z.string().default("https://api.z-api.io"),

    REFRESH_TOKEN_SECRET: z
      .string()
      .min(32, "REFRESH_TOKEN_SECRET deve ter pelo menos 32 caracteres")
      .optional(),

    REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(60 * 60 * 24 * 30), // 30 dias

    CHROME_PATH: z.string().optional(),
  },

  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
