import type { FastifyRequest, FastifyReply } from "fastify";
import * as dashboardService from "./dashboard.service";

export async function getSummary(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const data = await dashboardService.getSummary(user.companyId);
  return reply.status(200).send({ data });
}

export async function getUpcomingServices(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const query = request.query as { start?: string; end?: string };
  const data = await dashboardService.getUpcomingServices(user.companyId, query.start, query.end);
  return reply.status(200).send({ data });
}

export async function getExpiringContracts(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const data = await dashboardService.getExpiringContracts(user.companyId);
  return reply.status(200).send({ data });
}

export async function getRecentActivity(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const data = await dashboardService.getRecentActivity(user.companyId);
  return reply.status(200).send({ data });
}

export async function getTechnicianStatus(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const data = await dashboardService.getTechnicianStatus(user.companyId);
  return reply.status(200).send({ data });
}

export async function getMonthlyRevenue(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const data = await dashboardService.getMonthlyRevenue(user.companyId);
  return reply.status(200).send({ data });
}
