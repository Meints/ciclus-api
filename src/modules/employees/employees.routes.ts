import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as employeesController from "./employees.controller";

export async function employeesRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    employeesController.list,
  );

  app.post(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    employeesController.create,
  );

  app.get(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    employeesController.getById,
  );

  app.put(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    employeesController.update,
  );

  app.patch(
    "/:id/toggle",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    employeesController.toggle,
  );

  app.get(
    "/:id/services",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    employeesController.getServices,
  );

  app.get(
    "/:id/availability",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    employeesController.getAvailability,
  );
}
