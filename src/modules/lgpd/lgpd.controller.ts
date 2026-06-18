import type { FastifyRequest, FastifyReply } from "fastify";
import * as lgpdService from "./lgpd.service";

export async function exportData(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { sub: string; companyId: string };
  const data = await lgpdService.exportData(user.sub, user.companyId);
  return reply.status(200).send({ data });
}

export async function registerConsent(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { sub: string; companyId: string };
  const result = await lgpdService.registerConsent(user.companyId, user.sub);
  return reply.status(200).send({ data: result });
}

export async function getConsent(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const result = await lgpdService.getConsent(user.companyId);
  return reply.status(200).send({ data: result });
}
