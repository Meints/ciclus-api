import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import { env } from "../config/env";

export default fp(async (app) => {
  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    hook: "onRequest",
  });
});
