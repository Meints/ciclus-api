import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as contractsController from "./contracts.controller";

export async function contractsRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    contractsController.list,
  );

  app.post(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    contractsController.create,
  );

  app.get(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    contractsController.getById,
  );

  app.put(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    contractsController.update,
  );

  app.patch(
    "/:id/cancel",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    contractsController.cancel,
  );

  app.patch(
    "/:id/pause",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    contractsController.pause,
  );

  app.patch(
    "/:id/resume",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    contractsController.resume,
  );
}
