import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as customersController from "./customers.controller";

export async function customersRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    customersController.list,
  );

  app.post(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    customersController.create,
  );

  app.get(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    customersController.getById,
  );

  app.put(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    customersController.update,
  );

  app.patch(
    "/:id/toggle",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    customersController.toggle,
  );

  app.delete(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER")] },
    customersController.remove,
  );
}
