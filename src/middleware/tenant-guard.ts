import type { FastifyRequest, FastifyReply } from "fastify";
import { getRequestContext } from "../lib/request-context";

export function tenantGuard() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = getRequestContext();

    if (!ctx.companyId) {
      return reply.status(401).send({ message: "Tenant não identificado" });
    }

    const body = request.body as Record<string, unknown> | undefined;
    if (body?.companyId && body.companyId !== ctx.companyId) {
      return reply.status(403).send({ message: "Você não pode definir companyId" });
    }
  };
}
