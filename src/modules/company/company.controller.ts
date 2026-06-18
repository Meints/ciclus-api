import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../config/prisma";
import * as companyService from "./company.service";

export async function getCompany(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; role: string };
  const company = await companyService.getCompany(user.companyId, user.role);
  return reply.status(200).send({ data: company });
}

export async function updateCompany(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };
  const company = await companyService.updateCompany(
    user.companyId,
    request.body as Record<string, unknown>,
    user.sub,
  );
  return reply.status(200).send({ data: company });
}

export async function uploadLogo(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string; sub: string };

  // TODO: When @fastify/multipart is registered, extract file buffer and mimeType,
  // then call companyService.uploadLogo(companyId, buffer, mimeType, userId).
  // For now, accept a URL from the body or use a placeholder.
  const body = request.body as { url?: string } | undefined;
  const logoUrl = body?.url ?? `/logos/${user.companyId}.png`;

  await prisma.company.update({
    where: { id: user.companyId },
    data: { logoUrl },
  });

  return reply.status(200).send({ data: { logoUrl } });
}

export async function getUsage(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { companyId: string };
  const usage = await companyService.getUsage(user.companyId);
  return reply.status(200).send({ data: usage });
}
