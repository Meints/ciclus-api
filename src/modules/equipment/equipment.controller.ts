import type { FastifyRequest, FastifyReply } from "fastify";
import * as equipmentService from "./equipment.service";
import { validateOrThrow } from "../../lib/validate";
import { createEquipmentSchema } from "./dtos/create-equipment.dto";
import { updateEquipmentSchema } from "./dtos/update-equipment.dto";
import { equipmentFiltersSchema } from "./dtos/equipment-filters.dto";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { customerId } = request.params as { customerId: string };
  const query = validateOrThrow(equipmentFiltersSchema, request.query);
  const result = await equipmentService.list(user.companyId, customerId, {
    isActive: query.isActive,
    type: query.type,
  });
  return reply.status(200).send(result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { customerId } = request.params as { customerId: string };
  const body = validateOrThrow(createEquipmentSchema, request.body);
  const equipment = await equipmentService.create(user.companyId, customerId, body, user.sub);
  return reply.status(201).send({ data: equipment });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { customerId, equipmentId } = request.params as { customerId: string; equipmentId: string };
  const equipment = await equipmentService.getById(user.companyId, customerId, equipmentId);
  return reply.status(200).send({ data: equipment });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { customerId, equipmentId } = request.params as { customerId: string; equipmentId: string };
  const body = validateOrThrow(updateEquipmentSchema, request.body);
  const updated = await equipmentService.update(user.companyId, customerId, equipmentId, body, user.sub);
  return reply.status(200).send({ data: updated });
}

export async function toggle(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { customerId, equipmentId } = request.params as { customerId: string; equipmentId: string };
  const toggled = await equipmentService.toggle(user.companyId, customerId, equipmentId);
  return reply.status(200).send({ data: toggled });
}

export async function remove(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { customerId, equipmentId } = request.params as { customerId: string; equipmentId: string };
  await equipmentService.remove(user.companyId, customerId, equipmentId);
  return reply.status(204).send();
}
