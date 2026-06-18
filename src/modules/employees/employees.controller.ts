import type { FastifyRequest, FastifyReply } from "fastify";
import * as employeesService from "./employees.service";
import { validateOrThrow } from "../../lib/validate";
import { createEmployeeSchema } from "./dtos/create-employee.dto";
import { updateEmployeeSchema } from "./dtos/update-employee.dto";
import { employeeFiltersSchema } from "./dtos/employee-filters.dto";
import { employeeServicesFiltersSchema } from "./dtos/employee-services-filters.dto";

export async function list(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const query = validateOrThrow(employeeFiltersSchema, request.query);
  const result = await employeesService.list(
    user.companyId,
    { isActive: query.isActive },
    { page: query.page?.toString(), pageSize: query.pageSize?.toString() },
  );
  return reply.status(200).send(result);
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const body = validateOrThrow(createEmployeeSchema, request.body);
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
  const body = validateOrThrow(updateEmployeeSchema, request.body);
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
  const query = validateOrThrow(employeeServicesFiltersSchema, request.query);
  const result = await employeesService.getServices(
    user.companyId, id,
    { dateStart: query.dateStart, dateEnd: query.dateEnd, status: query.status },
    { page: query.page, pageSize: query.pageSize },
  );
  return reply.status(200).send(result);
}
