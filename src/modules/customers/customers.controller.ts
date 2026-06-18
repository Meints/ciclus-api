import type { FastifyRequest, FastifyReply } from "fastify";
import * as customersService from "./customers.service";
import { validateOrThrow } from "../../lib/validate";
import { createCustomerSchema } from "./dtos/create-customer.dto";
import { updateCustomerSchema } from "./dtos/update-customer.dto";
import { customerFiltersSchema } from "./dtos/customer-filters.dto";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; role: string };
  const query = validateOrThrow(customerFiltersSchema, request.query);
  const result = await customersService.list(
    user.companyId,
    { isActive: query.isActive, search: query.search },
    { page: query.page?.toString(), pageSize: query.pageSize?.toString() },
    user.role,
  );
  return reply.status(200).send(result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const body = validateOrThrow(createCustomerSchema, request.body);
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
  const body = validateOrThrow(updateCustomerSchema, request.body);
  const updated = await customersService.update(user.companyId, id, body as Record<string, unknown>, user.sub);
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
  return reply.status(204).send();
}

export async function reveal(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string; role: string };
  const { id } = request.params as { id: string };

  if (user.role === "TECHNICIAN") {
    return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Apenas administradores podem revelar dados sensíveis" } });
  }

  const data = await customersService.reveal(user.companyId, id, user.sub);
  return reply.status(200).send({ data });
}
