import type { FastifyRequest, FastifyReply } from "fastify";
import * as confirmService from "./confirm.service";

export async function getConfirmation(request: FastifyRequest, reply: FastifyReply) {
  const { token } = request.params as { token: string };
  const data = await confirmService.getConfirmationData(token);
  return reply.status(200).send({ data });
}

export async function confirmServiceHandler(request: FastifyRequest, reply: FastifyReply) {
  const { token } = request.params as { token: string };
  const ip = request.ip;
  const userAgent = request.headers["user-agent"] ?? "";
  const result = await confirmService.confirm(token, ip, userAgent);
  return reply.status(200).send(result);
}
