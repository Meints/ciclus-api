import type { FastifyRequest, FastifyReply } from "fastify";
import * as customersService from "./customers.service";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; role: string };
  const query = request.query as { page?: string; limit?: string; isActive?: string; search?: string };
  const result = await customersService.list(
    user.companyId,
    { isActive: query.isActive, search: query.search },
    query,
    user.role,
  );
  return reply.status(200).send(result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const body = request.body as {
    name: string;
    fantasyName?: string;
    documentType: "CPF" | "CNPJ";
    document: string;
    email?: string;
    phone?: string;
    address?: unknown;
    notes?: string;
  };
  const customer = await customersService.create(user.companyId, body);
  return reply.status(201).send({ data: customer });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const customer = await customersService.getById(user.companyId, id);
  return reply.status(200).send({ data: customer });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { id } = request.params as { id: string };
  const body = request.body as Record<string, unknown>;
  const updated = await customersService.update(user.companyId, id, body, user.sub);
  return reply.status(200).send({ data: updated });
}

export async function toggle(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const toggled = await customersService.toggle(user.companyId, id);
  return reply.status(200).send({ data: toggled });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  await customersService.remove(user.companyId, id);
  return reply.status(200).send({ success: true });
}
