import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import { env } from "../config/env";

export default fp(async (app) => {
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  });
});
