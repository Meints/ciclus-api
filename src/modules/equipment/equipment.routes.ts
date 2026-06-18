import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as equipmentController from "./equipment.controller";

export async function equipmentRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    equipmentController.list,
  );

  app.post(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    equipmentController.create,
  );

  app.get(
    "/:equipmentId",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    equipmentController.getById,
  );

  app.put(
    "/:equipmentId",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    equipmentController.update,
  );

  app.patch(
    "/:equipmentId/toggle",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    equipmentController.toggle,
  );

  app.delete(
    "/:equipmentId",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    equipmentController.remove,
  );
}
