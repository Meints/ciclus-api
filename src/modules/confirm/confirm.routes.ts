import type { FastifyInstance } from "fastify";
import * as confirmController from "./confirm.controller";

export async function confirmRoutes(app: FastifyInstance) {
  app.get(
    "/confirm/:token",
    {
      config: { rateLimit: { max: 20, timeWindow: 60000 } },
    },
    confirmController.getConfirmation,
  );

  app.post(
    "/confirm/:token",
    {
      config: { rateLimit: { max: 5, timeWindow: 60000 } },
    },
    confirmController.confirmServiceHandler,
  );
}
