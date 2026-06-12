import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { env } from "../config/env";

export default fp(async (app) => {
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW,

    keyGenerator: (request) => {
      const userId = (request.user as { sub?: string } | undefined)?.sub;
      return userId ?? request.ip;
    },
  });
});
