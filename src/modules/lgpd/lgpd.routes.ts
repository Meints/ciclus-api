import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as lgpdController from "./lgpd.controller";

export async function lgpdRoutes(app: FastifyInstance) {
  app.get(
    "/lgpd/export",
    { preHandler: [app.authenticate] },
    lgpdController.exportData,
  );

  app.post(
    "/lgpd/consent",
    { preHandler: [app.authenticate, authorize("OWNER")] },
    lgpdController.registerConsent,
  );

  app.get(
    "/lgpd/consent",
    { preHandler: [app.authenticate, authorize("OWNER")] },
    lgpdController.getConsent,
  );
}
