import type { FastifyRequest, FastifyReply } from "fastify";
import * as contractsService from "./contracts.service";
import { validateOrThrow } from "../../lib/validate";
import { createContractSchema } from "./dtos/create-contract.dto";
import { updateContractSchema } from "./dtos/update-contract.dto";
import { cancelContractSchema } from "./dtos/cancel-contract.dto";
import { contractFiltersSchema } from "./dtos/contract-filters.dto";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const query = validateOrThrow(contractFiltersSchema, request.query);
  const result = await contractsService.list(user.companyId, {
    status: query.status,
    customerId: query.customerId,
    frequency: query.frequency,
    dateStart: query.dateStart,
    dateEnd: query.dateEnd,
  }, { page: query.page?.toString(), pageSize: query.pageSize?.toString() });
  return reply.status(200).send(result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const body = validateOrThrow(createContractSchema, request.body);
  const result = await contractsService.create(user.companyId, {
    customerId: body.customerId,
    serviceType: body.serviceType,
    frequency: body.frequency,
    startDate: body.startDate,
    endDate: body.endDate,
    amount: body.amount,
    employeeId: body.employeeId,
    notes: body.notes,
  }, user.sub);
  return reply.status(201).send({ data: result });
}

export async function getById(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const { id } = request.params as { id: string };
  const contract = await contractsService.getById(user.companyId, id);
  return reply.status(200).send({ data: contract });
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { id } = request.params as { id: string };
  const body = validateOrThrow(updateContractSchema, request.body);
  const updated = await contractsService.update(user.companyId, id, body as Record<string, unknown>, user.sub);
  return reply.status(200).send({ data: updated });
}

export async function cancel(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const { id } = request.params as { id: string };
  const body = validateOrThrow(cancelContractSchema, request.body);
  const updated = await contractsService.cancel(user.companyId, id, body, user.sub);
  return reply.status(200).send({ data: updated });
}
