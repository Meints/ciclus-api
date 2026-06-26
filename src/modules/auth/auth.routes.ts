import type { FastifyInstance } from "fastify";
import * as authController from "./auth.controller";

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/register",
    {
      config: { rateLimit: { max: 3, timeWindow: "60 minutes" } },
    },
    authController.register,
  );

  app.post(
    "/login",
    {
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    },
    authController.login,
  );

  app.post(
    "/logout",
    { preHandler: [app.authenticate] },
    authController.logout,
  );

  app.get(
    "/me",
    { preHandler: [app.authenticate] },
    authController.me,
  );

  app.post("/refresh", authController.refresh);

  app.post(
    "/change-password",
    { preHandler: [app.authenticate] },
    authController.changePassword,
  );

  app.post(
    "/forgot-password",
    {
      config: { rateLimit: { max: 3, timeWindow: "60 minutes" } },
    },
    authController.forgotPassword,
  );

  app.post(
    "/reset-password",
    {
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
    },
    authController.resetPassword,
  );
}
