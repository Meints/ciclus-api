import type { FastifyRequest, FastifyReply } from "fastify";
import * as usersService from "./users.service";
import { validateOrThrow } from "../../lib/validate";
import { createUserSchema } from "./dtos/create-user.dto";
import { updateUserSchema } from "./dtos/update-user.dto";
import { userFiltersSchema } from "./dtos/user-filters.dto";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const query = validateOrThrow(userFiltersSchema, request.query);
  const result = await usersService.list(
    user.companyId,
    { role: query.role, isActive: query.isActive },
    { page: query.page?.toString(), pageSize: query.pageSize?.toString() },
  );
  return reply.status(200).send(result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string; role: string };
  const body = validateOrThrow(createUserSchema, request.body);
  const newUser = await usersService.create(user.companyId, body, user.sub, user.role);
  return reply.status(201).send({ data: newUser });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const found = await usersService.getById(user.companyId, id);
  return reply.status(200).send({ data: found });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; role: string };
  const { id } = request.params as { id: string };
  const body = validateOrThrow(updateUserSchema, request.body);
  const updated = await usersService.update(user.companyId, id, body, user.role);
  return reply.status(200).send({ data: updated });
}

export async function toggle(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { id } = request.params as { id: string };
  const toggled = await usersService.toggle(user.companyId, id, user.sub);
  return reply.status(200).send({ data: toggled });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { id } = request.params as { id: string };
  await usersService.remove(user.companyId, id, user.sub);
  return reply.status(204).send();
}
