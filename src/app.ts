import Fastify from "fastify";
import corsPlugin from "./plugins/cors";
import helmetPlugin from "./plugins/helmet";
import cookiePlugin from "./plugins/cookie";
import jwtPlugin from "./plugins/jwt";
import rateLimitPlugin from "./plugins/rate-limit";
import swaggerPlugin from "./plugins/swagger";
import { loggerConfig } from "./config/logger";
import { healthRoute } from "./routes/health.route";

export function buildApp() {
  const app = Fastify({ logger: loggerConfig });

  app.register(cookiePlugin);
  app.register(jwtPlugin);

  app.register(corsPlugin);
  app.register(helmetPlugin);
  app.register(rateLimitPlugin);
  app.register(swaggerPlugin);
  app.register(healthRoute);

  return app;
}
