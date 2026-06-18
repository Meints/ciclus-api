import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as usersController from "./users.controller";

export async function usersRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    usersController.list,
  );

  app.post(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    usersController.create,
  );

  app.get(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    usersController.getById,
  );

  app.put(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    usersController.update,
  );

  app.patch(
    "/:id/toggle",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    usersController.toggle,
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER")] },
    usersController.remove,
  );
}
