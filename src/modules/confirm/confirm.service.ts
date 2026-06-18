import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";

function anonymizeIp(ip: string): string {
  if (!ip || ip === "::1" || ip.startsWith("::ffff:")) {
    return "0.0.0.0";
  }
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.0.0`;
  }
  return "0.0.0.0";
}

export async function getConfirmationData(token: string) {
  const service = await prisma.service.findUnique({
    where: { confirmationToken: token },
    include: {
      employee: { select: { name: true } },
      company: { select: { name: true, logoUrl: true } },
      customer: { select: { id: true, name: true, address: true } },
      equipment: {
        include: {
          equipment: {
            select: { type: true, brand: true, model: true, location: true },
          },
        },
      },
    },
  });

  if (!service) {
    throw new AppError("Link de confirmação inválido", 404, "NOT_FOUND");
  }

  if (service.confirmationTokenExpiresAt && service.confirmationTokenExpiresAt < new Date()) {
    throw new AppError("Link de confirmação expirado", 410, "EXPIRED");
  }

  if (service.confirmedAt) {
    return {
      alreadyConfirmed: true,
      confirmedAt: service.confirmedAt,
    };
  }

  return {
    serviceNumber: service.serviceNumber,
    serviceType: service.serviceType,
    scheduledAt: service.scheduledAt,
    completedDate: service.completedDate,
    technicianName: service.employee?.name ?? null,
    companyName: service.company.name,
    companyLogo: service.company.logoUrl,
    customerName: service.customer.name,
    equipment: service.equipment.map((se) => ({
      type: se.equipment.type,
      brand: se.equipment.brand,
      model: se.equipment.model,
      location: se.equipment.location,
    })),
  };
}

export async function confirm(token: string, ip: string, userAgent: string) {
  const service = await prisma.service.findUnique({
    where: { confirmationToken: token },
    select: {
      id: true,
      serviceNumber: true,
      companyId: true,
      confirmationTokenExpiresAt: true,
      confirmedAt: true,
    },
  });

  if (!service) {
    throw new AppError("Link de confirmação inválido", 404, "NOT_FOUND");
  }

  if (service.confirmationTokenExpiresAt && service.confirmationTokenExpiresAt < new Date()) {
    throw new AppError("Link de confirmação expirado", 410, "EXPIRED");
  }

  if (service.confirmedAt) {
    throw new AppError("Serviço já confirmado", 409, "ALREADY_CONFIRMED");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.service.update({
      where: { id: service.id },
      data: {
        status: "CONFIRMED",
        confirmedAt: now,
        confirmedIp: anonymizeIp(ip),
        confirmedUserAgent: userAgent,
        confirmationToken: null,
        confirmationTokenExpiresAt: null,
      },
    });

    await createAuditLog({
      companyId: service.companyId,
      entityType: "Service",
      entityId: service.id,
      action: "CONFIRM",
    });
  });

  return {
    success: true,
    serviceNumber: service.serviceNumber,
    confirmedAt: now,
  };
}
