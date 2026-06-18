import type { FastifyRequest, FastifyReply } from "fastify";
import * as servicesService from "./services.service";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; role: string; sub: string };
  const query = request.query as {
    page?: string;
    limit?: string;
    status?: string;
    employeeId?: string;
    customerId?: string;
    contractId?: string;
    dateStart?: string;
    dateEnd?: string;
  };
  const result = await servicesService.list(
    user.companyId,
    {
      status: query.status,
      employeeId: query.employeeId,
      customerId: query.customerId,
      contractId: query.contractId,
      dateStart: query.dateStart,
      dateEnd: query.dateEnd,
    },
    query,
    user.role,
    user.sub,
  );
  return reply.status(200).send(result);
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; role: string };
  const { id } = request.params as { id: string };
  const service = await servicesService.getById(user.companyId, id, user.role);
  return reply.status(200).send({ data: service });
}

export async function start(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const updated = await servicesService.start(user.companyId, id);
  return reply.status(200).send({ data: updated });
}

export async function complete(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = request.body as {
    executionNotes?: string;
    durationMinutes?: number;
    equipmentNotes?: Array<{ equipmentId: string; notes: string }>;
  };
  const result = await servicesService.complete(user.companyId, id, body);
  return reply.status(200).send({ data: result });
}

export async function cancel(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = request.body as { reason: string };
  const updated = await servicesService.cancel(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
}

export async function reschedule(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = request.body as { scheduledAt: string };
  const updated = await servicesService.reschedule(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
}

export async function getReport(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const result = await servicesService.getReport(user.companyId, id);
  return reply.status(200).send(result);
}

export async function addPhotos(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const files = (request as any).files ?? [];
  const result = await servicesService.addPhotos(user.companyId, id, files);
  return reply.status(200).send(result);
}

export async function removePhoto(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id, photoId } = request.params as { id: string; photoId: string };
  const result = await servicesService.removePhoto(user.companyId, id, photoId);
  return reply.status(200).send(result);
}

export async function linkEquipment(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = request.body as { equipmentIds: string[] };
  const result = await servicesService.linkEquipment(user.companyId, id, body.equipmentIds);
  return reply.status(200).send(result);
}
