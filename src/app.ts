import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import staticFiles from "@fastify/static";
import { env } from "./config/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { loggerConfig } from "./config/logger";
import { AppError } from "./lib/app-error";
import cookiePlugin from "./plugins/cookie";
import jwtPlugin from "./plugins/jwt";
import corsPlugin from "./plugins/cors";
import helmetPlugin from "./plugins/helmet";
import rateLimitPlugin from "./plugins/rate-limit";
import swaggerPlugin from "./plugins/swagger";
import requestContextPlugin from "./lib/request-context";
import { healthRoute } from "./routes/health.route";
import { authRoutes } from "./modules/auth/auth.routes";
import { companyRoutes } from "./modules/company/company.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { employeesRoutes } from "./modules/employees/employees.routes";
import { customersRoutes } from "./modules/customers/customers.routes";
import { equipmentRoutes } from "./modules/equipment/equipment.routes";
import { contractsRoutes } from "./modules/contracts/contracts.routes";
import { servicesRoutes } from "./modules/services/services.routes";
import { confirmRoutes } from "./modules/confirm/confirm.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { lgpdRoutes } from "./modules/lgpd/lgpd.routes";
import { adminRoutes } from "./modules/admin/admin.routes";

export function buildApp() {
  const app = Fastify({ logger: loggerConfig });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    const err = error as Record<string, unknown>;

    if (err.validation) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Dados inválidos", details: err.validation },
      });
    }

    if (err.statusCode === 429) {
      return reply.status(429).send({
        error: { code: "RATE_LIMIT", message: "Muitas requisições. Tente novamente mais tarde." },
      });
    }

    app.log.error(err);

    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: env.NODE_ENV === "production" ? "Erro interno do servidor" : (err.message as string) || "Erro interno",
      },
    });
  });

  app.register(cookiePlugin);
  app.register(jwtPlugin);
  app.register(corsPlugin);
  app.register(helmetPlugin);
  app.register(rateLimitPlugin);
  app.register(requestContextPlugin);

  app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  app.register(staticFiles, {
    root: path.resolve(__dirname, "..", "uploads"),
    prefix: "/uploads/",
    decorateReply: false,
  });

  app.register(swaggerPlugin);
  app.register(healthRoute);

  app.register(authRoutes, { prefix: "/auth" });
  app.register(companyRoutes, { prefix: "/company" });
  app.register(usersRoutes, { prefix: "/users" });
  app.register(employeesRoutes, { prefix: "/employees" });
  app.register(customersRoutes, { prefix: "/customers" });
  app.register(equipmentRoutes, { prefix: "/customers/:customerId/equipment" });
  app.register(contractsRoutes, { prefix: "/contracts" });
  app.register(servicesRoutes, { prefix: "/services" });
  app.register(confirmRoutes);
  app.register(dashboardRoutes);
  app.register(notificationsRoutes, { prefix: "/notifications" });
  app.register(lgpdRoutes);
  app.register(adminRoutes, { prefix: "/admin" });

  return app;
}
