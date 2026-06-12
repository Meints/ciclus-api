import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../config/prisma";

const startTime = Date.now();

export async function healthRoute(app: FastifyInstance) {
  app.get("/health", async (_request: FastifyRequest, reply: FastifyReply) => {
    let databaseStatus = "up";

    try {
      await prisma.$queryRawUnsafe("SELECT 1");
    } catch {
      databaseStatus = "down";
    }

    const statusCode = databaseStatus === "down" ? 503 : 200;

    return reply.status(statusCode).send({
      status: databaseStatus === "down" ? "unhealthy" : "ok",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      database: databaseStatus,
    });
  });
}
