import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { buildServiceReportData } from "../services/services.helpers";
import { generateServiceReport } from "../../integrations/pdf/pdf.service";
import { createNotification } from "../notifications/notifications.service";

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

export async function confirm(token: string, ip: string, userAgent: string, name: string, document?: string, documentType?: string) {
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
        confirmedName: name,
        confirmedDocument: document ?? null,
        confirmedDocumentType: documentType ?? null,
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

  try {
    const reportData = await buildServiceReportData(service.id);
    const reportUrl = await generateServiceReport(service.id, reportData);
    if (reportUrl) {
      await prisma.service.update({
        where: { id: service.id },
        data: { reportUrl },
      });
    }
  } catch (error) {
    console.error(`[confirm] Falha ao regenerar PDF na confirmação da OS ${service.id}:`, error);
  }

  createNotification({
    companyId: service.companyId,
    type: "SERVICE_CONFIRMED",
    title: "Serviço confirmado pelo cliente",
    body: `OS #${service.serviceNumber} foi confirmada por ${name}.`,
    entityType: "Service",
    entityId: service.id,
  }).catch(console.error);

  return {
    success: true,
    serviceNumber: service.serviceNumber,
    confirmedAt: now,
  };
}
