import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as servicesController from "./services.controller";

export async function servicesRoutes(app: FastifyInstance) {
  app.post(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.create,
  );

  app.get(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    servicesController.list,
  );

  app.get(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    servicesController.getById,
  );

  app.patch(
    "/:id/start",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    servicesController.start,
  );

  app.patch(
    "/:id/revert",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.revert,
  );

  app.patch(
    "/:id/reopen",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.reopen,
  );

  app.patch(
    "/:id/complete",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    servicesController.complete,
  );

  app.patch(
    "/:id/cancel",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.cancel,
  );

  app.patch(
    "/:id/reschedule",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.reschedule,
  );

  app.post(
    "/:id/resend-confirmation",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.resendConfirmation,
  );

  app.post(
    "/:id/preview-report",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    servicesController.previewReport,
  );

  app.get(
    "/:id/report",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.getReport,
  );

  app.post(
    "/:id/generate-pdf",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.generatePdf,
  );

  app.post(
    "/:id/photos",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    servicesController.addPhotos,
  );

  app.delete(
    "/:id/photos/:photoId",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.removePhoto,
  );

  app.patch(
    "/:id",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    servicesController.update,
  );

  app.patch(
    "/:id/equipment",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN", "TECHNICIAN")] },
    servicesController.linkEquipment,
  );
}
