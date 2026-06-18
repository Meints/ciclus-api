import type { FastifyRequest, FastifyReply } from "fastify";
import * as equipmentService from "./equipment.service";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { customerId } = request.params as { customerId: string };
  const query = request.query as { isActive?: string; type?: string };
  const result = await equipmentService.list(user.companyId, customerId, {
    isActive: query.isActive,
    type: query.type,
  });
  return reply.status(200).send(result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { customerId } = request.params as { customerId: string };
  const body = request.body as {
    type: string;
    brand?: string;
    model?: string;
    capacity?: string;
    serialNumber?: string;
    location?: string;
    installedAt?: string;
    notes?: string;
  };
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
  const body = request.body as {
    type?: string;
    brand?: string;
    model?: string;
    capacity?: string;
    serialNumber?: string;
    location?: string;
    installedAt?: string;
    notes?: string;
  };
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
  return reply.status(200).send({ success: true });
}
