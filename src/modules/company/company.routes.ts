import type { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/authorize";
import * as companyController from "./company.controller";

export async function companyRoutes(app: FastifyInstance) {
  app.get(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    companyController.getCompany,
  );

  app.put(
    "/",
    { preHandler: [app.authenticate, authorize("OWNER")] },
    companyController.updateCompany,
  );

  app.post(
    "/logo",
    { preHandler: [app.authenticate, authorize("OWNER")] },
    companyController.uploadLogo,
  );

  app.get(
    "/usage",
    { preHandler: [app.authenticate, authorize("OWNER", "ADMIN")] },
    companyController.getUsage,
  );
}
