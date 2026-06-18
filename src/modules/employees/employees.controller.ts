import type { FastifyRequest, FastifyReply } from "fastify";
import * as employeesService from "./employees.service";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const query = request.query as { page?: string; limit?: string; isActive?: string };
  const result = await employeesService.list(user.companyId, { isActive: query.isActive }, query);
  return reply.status(200).send(result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const body = request.body as { name: string; email?: string; phone?: string };
  const employee = await employeesService.create(user.companyId, body);
  return reply.status(201).send({ data: employee });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const employee = await employeesService.getById(user.companyId, id);
  return reply.status(200).send({ data: employee });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = request.body as { name?: string; email?: string; phone?: string };
  const updated = await employeesService.update(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
}

export async function toggle(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const toggled = await employeesService.toggle(user.companyId, id);
  return reply.status(200).send({ data: toggled });
}

export async function getServices(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const query = request.query as { page?: string; limit?: string; dateStart?: string; dateEnd?: string; status?: string };
  const result = await employeesService.getServices(user.companyId, id, { dateStart: query.dateStart, dateEnd: query.dateEnd, status: query.status }, query);
  return reply.status(200).send(result);
}
