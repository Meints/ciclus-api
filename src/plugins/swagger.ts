import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { env } from "../config/env";

export default fp(async (app) => {
  if (env.NODE_ENV === "production") return;

  await app.register(swagger, {
    openapi: {
      info: {
        title: "ContratosPRO API",
        description: "API de gestão para empresas de serviços recorrentes",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
  });
});
