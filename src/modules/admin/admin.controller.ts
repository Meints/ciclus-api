import type { FastifyRequest, FastifyReply } from "fastify";
import * as adminService from "./admin.service";
import { validateOrThrow } from "../../lib/validate";
import { updateCompanyPlanSchema, createCompanySchema, updateCompanyUserRoleSchema } from "./dtos/admin.dto";

export async function getOverview(_request: FastifyRequest, reply: FastifyReply) {
  const data = await adminService.getOverview();
  return reply.status(200).send({ data });
}

export async function listCompanies(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as {
    page?: string;
    pageSize?: string;
    plan?: string;
    search?: string;
  };
  const data = await adminService.listCompanies({
    page: query.page ? Number(query.page) : undefined,
    pageSize: query.pageSize ? Number(query.pageSize) : undefined,
    plan: query.plan && query.plan !== "ALL" ? query.plan : undefined,
    search: query.search || undefined,
  });
  return reply.status(200).send(data);
}

export async function getCompanyDetail(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await adminService.getCompanyDetail(id);
  return reply.status(200).send({ data });
}

export async function updateCompanyPlan(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { plan } = validateOrThrow(updateCompanyPlanSchema, request.body);
  const data = await adminService.updateCompanyPlan(id, plan);
  return reply.status(200).send({ data });
}

export async function getGlobalMRR(_request: FastifyRequest, reply: FastifyReply) {
  const data = await adminService.getGlobalMRR();
  return reply.status(200).send({ data });
}

export async function getAtRisk(_request: FastifyRequest, reply: FastifyReply) {
  const data = await adminService.getAtRiskCompanies();
  return reply.status(200).send({ data });
}

export async function impersonate(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const originalUserId = request.user.sub;
  const result = await adminService.generateImpersonationToken(id);

  const token = await reply.jwtSign(
    {
      sub: result.userId,
      companyId: result.companyId,
      role: result.role as "OWNER" | "ADMIN" | "TECHNICIAN" | "SUPERADMIN",
      impersonating: true,
      originalUserId,
    },
    { expiresIn: 3600 },
  );

  return reply.status(200).send({ data: { token } });
}

export async function exitImpersonation(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  if (!user.impersonating || !user.originalUserId) {
    return reply.status(400).send({ message: "Nenhuma sessão de impersonation ativa" });
  }

  const superadmin = await adminService.getSuperadminById(user.originalUserId);

  const token = await reply.jwtSign(
    {
      sub: superadmin.id,
      companyId: superadmin.companyId,
      role: "SUPERADMIN",
    },
    { expiresIn: "8h" },
  );

  return reply.status(200).send({ data: { token } });
}

export async function createCompany(request: FastifyRequest, reply: FastifyReply) {
  const body = validateOrThrow(createCompanySchema, request.body);
  const data = await adminService.createCompany(body);
  return reply.status(201).send({ data });
}

export async function toggleCompany(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await adminService.toggleCompanyStatus(id);
  return reply.status(200).send({ data });
}

export async function listCompanyUsers(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await adminService.listCompanyUsers(id);
  return reply.status(200).send({ data });
}

export async function removeCompanyUser(request: FastifyRequest, reply: FastifyReply) {
  const { id, userId } = request.params as { id: string; userId: string };
  await adminService.removeCompanyUser(id, userId);
  return reply.status(204).send();
}

export async function updateCompanyUserRole(request: FastifyRequest, reply: FastifyReply) {
  const { id, userId } = request.params as { id: string; userId: string };
  const { role } = validateOrThrow(updateCompanyUserRoleSchema, request.body);
  const data = await adminService.updateCompanyUserRole(id, userId, role);
  return reply.status(200).send({ data });
}
