import type { FastifyRequest, FastifyReply } from "fastify";
import * as adminService from "./admin.service";

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
  const { plan } = request.body as { plan: string };
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
  const result = await adminService.generateImpersonationToken(id);

  const token = await reply.jwtSign(
    {
      sub: result.userId,
      companyId: result.companyId,
      role: result.role as "OWNER" | "ADMIN" | "TECHNICIAN" | "SUPERADMIN",
      impersonating: true,
    },
    { expiresIn: 3600 },
  );

  return reply.status(200).send({ data: { token } });
}
