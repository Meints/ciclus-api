import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as adminController from "./admin.controller";

export async function adminRoutes(app: FastifyInstance) {
  // Guard: all routes in this plugin require an authenticated SUPERADMIN
  const guard = { preHandler: [app.authenticate, authorize("SUPERADMIN")] };

  app.get("/overview", guard, adminController.getOverview);
  app.get("/companies", guard, adminController.listCompanies);
  app.get("/companies/:id", guard, adminController.getCompanyDetail);
  app.patch("/companies/:id/plan", guard, adminController.updateCompanyPlan);
  app.get("/metrics/mrr", guard, adminController.getGlobalMRR);
  app.get("/metrics/at-risk", guard, adminController.getAtRisk);
  app.post("/companies/:id/impersonate", guard, adminController.impersonate);
}
