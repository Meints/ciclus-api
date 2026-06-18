import type { FastifyRequest, FastifyReply } from "fastify";
import * as contractsService from "./contracts.service";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const query = request.query as {
    page?: string;
    limit?: string;
    status?: string;
    customerId?: string;
    frequency?: string;
    dateStart?: string;
    dateEnd?: string;
  };
  const result = await contractsService.list(user.companyId, {
    status: query.status,
    customerId: query.customerId,
    frequency: query.frequency,
    dateStart: query.dateStart,
    dateEnd: query.dateEnd,
  }, query);
  return reply.status(200).send(result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const body = request.body as {
    customerId: string;
    serviceType: string;
    frequency: string;
    startDate: string;
    endDate: string;
    amount: number;
    employeeId?: string;
    notes?: string;
  };
  const result = await contractsService.create(user.companyId, body, user.sub);
  return reply.status(201).send({ data: result });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const query = request.query as { page?: string; limit?: string };
  const contract = await contractsService.getById(user.companyId, id, query);
  return reply.status(200).send({ data: contract });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { id } = request.params as { id: string };
  const body = request.body as Record<string, unknown>;
  const updated = await contractsService.update(user.companyId, id, body, user.sub);
  return reply.status(200).send({ data: updated });
}

export async function cancel(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { id } = request.params as { id: string };
  const body = request.body as { reason: string };
  const updated = await contractsService.cancel(user.companyId, id, body, user.sub);
  return reply.status(200).send({ data: updated });
}
