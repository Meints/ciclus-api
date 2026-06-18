import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";

export async function exportData(
  userId: string,
  companyId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404, "NOT_FOUND");
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { userId, companyId },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true,
    },
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "User",
    entityId: userId,
    action: "EXPORT_DATA",
  });

  return {
    exportedAt: new Date().toISOString(),
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    auditLogs,
  };
}

export async function registerConsent(companyId: string, userId: string) {
  const now = new Date();

  await prisma.company.update({
    where: { id: companyId },
    data: { dataConsentAt: now },
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "Company",
    entityId: companyId,
    action: "CONSENT",
  });

  return { dataConsentAt: now, accepted: true };
}

export async function getConsent(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { dataConsentAt: true },
  });

  if (!company) {
    throw new AppError("Empresa não encontrada", 404, "NOT_FOUND");
  }

  return {
    dataConsentAt: company.dataConsentAt,
    accepted: company.dataConsentAt !== null,
  };
}
