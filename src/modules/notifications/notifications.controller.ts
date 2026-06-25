import type { FastifyRequest, FastifyReply } from "fastify";
import * as notificationsService from "./notifications.service";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const query = request.query as { page?: string };
  const page = query.page ? parseInt(query.page, 10) || 1 : 1;
  const result = await notificationsService.getNotifications(user.companyId, user.sub, page);
  return reply.status(200).send(result);
}

export async function markRead(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const result = await notificationsService.markRead(user.companyId, id);
  return reply.status(200).send({ data: result });
}

export async function markAllRead(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const result = await notificationsService.markAllRead(user.companyId, user.sub);
  return reply.status(200).send({ data: result });
}
