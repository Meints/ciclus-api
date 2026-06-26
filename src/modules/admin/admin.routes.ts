import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as adminController from "./admin.controller";

export async function adminRoutes(app: FastifyInstance) {
  const guard = { preHandler: [app.authenticate, authorize("SUPERADMIN")] };

  app.get("/overview", guard, adminController.getOverview);

  // Companies
  app.get("/companies", guard, adminController.listCompanies);
  app.post("/companies", guard, adminController.createCompany);
  app.get("/companies/:id", guard, adminController.getCompanyDetail);
  app.patch("/companies/:id/plan", guard, adminController.updateCompanyPlan);
  app.patch("/companies/:id/toggle", guard, adminController.toggleCompany);
  app.post("/companies/:id/impersonate", guard, adminController.impersonate);

  // Company user management
  app.get("/companies/:id/users", guard, adminController.listCompanyUsers);
  app.delete("/companies/:id/users/:userId", guard, adminController.removeCompanyUser);
  app.patch("/companies/:id/users/:userId/role", guard, adminController.updateCompanyUserRole);

  // Metrics
  app.get("/metrics/mrr", guard, adminController.getGlobalMRR);
  app.get("/metrics/at-risk", guard, adminController.getAtRisk);

  // Exit impersonation — requires only auth, not SUPERADMIN role
  app.post("/impersonate/exit", { preHandler: [app.authenticate] }, adminController.exitImpersonation);
}
