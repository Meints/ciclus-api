import type { FastifyRequest, FastifyReply } from "fastify";
import * as servicesService from "./services.service";
import { validateOrThrow } from "../../lib/validate";
import { completeServiceSchema, updateChecklistSchema } from "./dtos/complete-service.dto";
import { cancelServiceSchema } from "./dtos/cancel-service.dto";
import { rescheduleServiceSchema } from "./dtos/reschedule-service.dto";
import { serviceFiltersSchema } from "./dtos/service-filters.dto";
import { linkEquipmentSchema } from "./dtos/link-equipment.dto";
import { createServiceSchema } from "./dtos/create-service.dto";
import { updateServiceSchema } from "./dtos/update-service.dto";

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const body = validateOrThrow(createServiceSchema, request.body);
  const service = await servicesService.create(user.companyId, body);
  return reply.status(201).send({ data: service });
}

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; role: string; sub: string };
  const query = validateOrThrow(serviceFiltersSchema, request.query);
  const result = await servicesService.list(
    user.companyId,
    {
      search: query.search,
      status: query.status,
      employeeId: query.employeeId,
      customerId: query.customerId,
      contractId: query.contractId,
      dateStart: query.dateStart,
      dateEnd: query.dateEnd,
    },
    { page: query.page?.toString(), pageSize: query.pageSize?.toString() },
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

export async function revert(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const updated = await servicesService.revert(user.companyId, id);
  return reply.status(200).send({ data: updated });
}

export async function reopen(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const updated = await servicesService.reopen(user.companyId, id);
  return reply.status(200).send({ data: updated });
}

export async function complete(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = validateOrThrow(completeServiceSchema, request.body);
  const result = await servicesService.complete(user.companyId, id, body);
  return reply.status(200).send({ data: result });
}

export async function togglePaid(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const updated = await servicesService.togglePaid(user.companyId, id);
  return reply.status(200).send({ data: updated });
}

export async function updateChecklist(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = validateOrThrow(updateChecklistSchema, request.body);
  const updated = await servicesService.updateChecklist(user.companyId, id, body.checklistData);
  return reply.status(200).send({ data: updated });
}

export async function cancel(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = validateOrThrow(cancelServiceSchema, request.body);
  const updated = await servicesService.cancel(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
}

export async function reschedule(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = validateOrThrow(rescheduleServiceSchema, request.body);
  const updated = await servicesService.reschedule(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
}

export async function resendConfirmation(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const result = await servicesService.resendConfirmation(user.companyId, id);
  return reply.status(200).send({ data: result });
}

export async function previewReport(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const rawBody = request.body as Record<string, unknown> | undefined;
  const body = rawBody ? {
    executionNotes: typeof rawBody.executionNotes === "string" ? rawBody.executionNotes.slice(0, 2000) : undefined,
    durationMinutes: typeof rawBody.durationMinutes === "number" ? rawBody.durationMinutes : undefined,
    equipmentNotes: Array.isArray(rawBody.equipmentNotes) ? (rawBody.equipmentNotes as Array<{ equipmentId: string; note: string }>).slice(0, 50) : undefined,
  } : undefined;
  const buffer = await servicesService.previewReport(user.companyId, id, body);
  return reply.header("Content-Type", "application/pdf").send(buffer);
}

export async function generatePdf(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const result = await servicesService.generatePdf(user.companyId, id);
  return reply.status(200).send({ data: result });
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
  await servicesService.removePhoto(user.companyId, id, photoId);
  return reply.status(204).send();
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = validateOrThrow(updateServiceSchema, request.body);
  const updated = await servicesService.update(user.companyId, id, body);
  return reply.status(200).send({ data: updated });
}

export async function linkEquipment(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const body = validateOrThrow(linkEquipmentSchema, request.body);
  const result = await servicesService.linkEquipment(user.companyId, id, body.equipmentIds);
  return reply.status(200).send(result);
}
