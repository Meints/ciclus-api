import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../config/prisma";
import * as companyService from "./company.service";
import { validateOrThrow } from "../../lib/validate";
import { updateCompanySchema } from "./dtos/update-company.dto";

export async function getCompany(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; role: string };
  const company = await companyService.getCompany(user.companyId, user.role);
  return reply.status(200).send({ data: company });
}

export async function updateCompany(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const body = validateOrThrow(updateCompanySchema, request.body);
  const company = await companyService.updateCompany(user.companyId, body as Record<string, unknown>, user.sub);
  return reply.status(200).send({ data: company });
}

export async function uploadLogo(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };

  const file = await request.file();
  if (!file) {
    return reply.status(400).send({ error: { code: "NO_FILE", message: "Nenhum arquivo enviado" } });
  }

  const buffer = await file.toBuffer();
  const mimeType = file.mimetype;

  const result = await companyService.uploadLogo(user.companyId, buffer, mimeType, user.sub);
  return reply.status(200).send({ data: result });
}

export async function getUsage(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const usage = await companyService.getUsage(user.companyId);
  return reply.status(200).send({ data: usage });
}
