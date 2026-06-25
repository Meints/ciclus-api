import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as notificationsController from "./notifications.controller";

export async function notificationsRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    notificationsController.list,
  );

  app.patch(
    "/read-all",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    notificationsController.markAllRead,
  );

  app.patch(
    "/:id/read",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    notificationsController.markRead,
  );
}
