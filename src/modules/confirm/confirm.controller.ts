import type { FastifyRequest, FastifyReply } from "fastify";
import * as confirmService from "./confirm.service";
import { confirmBodySchema } from "./confirm.schema";

export async function getConfirmation(request: FastifyRequest, reply: FastifyReply) {
  const { token } = request.params as { token: string };
  const data = await confirmService.getConfirmationData(token);
  return reply.status(200).send({ data });
}

export async function confirmServiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const { token } = request.params as { token: string };
  const ip = request.ip;
  const userAgent = request.headers["user-agent"] ?? "";
  const { name, document, documentType } = confirmBodySchema.parse(request.body ?? {});
  const result = await confirmService.confirm(token, ip, userAgent, name, document, documentType);
  return reply.status(200).send(result);
}
