import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as dashboardController from "./dashboard.controller";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    "/dashboard/summary",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    dashboardController.getSummary,
  );

  app.get(
    "/dashboard/upcoming-services",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    dashboardController.getUpcomingServices,
  );

  app.get(
    "/dashboard/expiring-contracts",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    dashboardController.getExpiringContracts,
  );

  app.get(
    "/dashboard/recent-activity",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    dashboardController.getRecentActivity,
  );

  app.get(
    "/dashboard/technician-status",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    dashboardController.getTechnicianStatus,
  );

  app.get(
    "/dashboard/monthly-revenue",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    dashboardController.getMonthlyRevenue,
  );
}
