import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { maskCustomerForTechnician, maskDocument, maskEmail, type CustomerRaw } from "../../lib/mask";
import { parsePagination, buildSkip, buildMeta } from "../../utils/pagination";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env";

export async function list(
  companyId: string,
  filters: {
    status?: string;
    employeeId?: string;
    customerId?: string;
    contractId?: string;
    dateStart?: string;
    dateEnd?: string;
  },
  query: { page?: string; pageSize?: string },
  userRole: string,
  userId?: string,
) {
  const pagination = parsePagination(query);
  const where: Record<string, unknown> = { companyId, deletedAt: null };

  if (filters.status) where.status = filters.status;
  if (filters.employeeId) where.employeeId = filters.employeeId;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.contractId) where.contractId = filters.contractId;

  if (filters.dateStart || filters.dateEnd) {
    const scheduledAtFilter: Record<string, Date> = {};
    if (filters.dateStart) scheduledAtFilter.gte = new Date(filters.dateStart);
    if (filters.dateEnd) scheduledAtFilter.lte = new Date(filters.dateEnd);
    where.scheduledAt = scheduledAtFilter;
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where: where as any,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { scheduledAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
      },
    }),
    prisma.service.count({ where: where as any }),
  ]);

  return { data: services, meta: buildMeta(total, pagination) };
}

export async function getById(companyId: string, serviceId: string, userRole?: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    include: {
      customer: true,
      employee: { select: { id: true, name: true, phone: true } },
      equipment: { include: { equipment: true } },
      photos: true,
    },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");

  const customer = service.customer as unknown as CustomerRaw;

  if (userRole === "TECHNICIAN") {
    return {
      ...service,
      customer: maskCustomerForTechnician(customer),
    };
  }

  return {
    ...service,
    customer: {
      ...customer,
      document: customer.document
        ? maskDocument(customer.document, (customer.documentType as "CPF" | "CNPJ") || "CNPJ")
        : null,
      email: customer.email ? maskEmail(customer.email) : null,
    },
  };
}

export async function start(companyId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");
  if (service.status !== "SCHEDULED") {
    throw new AppError("Apenas serviços agendados podem ser iniciados", 400, "INVALID_STATUS");
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { status: "IN_PROGRESS" },
  });

  await createAuditLog({
    companyId, entityType: "Service", entityId: serviceId, action: "START",
    oldData: { status: "SCHEDULED" } as Record<string, unknown>,
    newData: { status: "IN_PROGRESS" } as Record<string, unknown>,
  });

  return updated;
}

export async function complete(
  companyId: string, serviceId: string,
  data: { executionNotes?: string; durationMinutes?: number; equipmentNotes?: Array<{ equipmentId: string; note: string }> },
) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");
  if (!["SCHEDULED", "IN_PROGRESS"].includes(service.status)) {
    throw new AppError("Apenas serviços agendados ou em andamento podem ser concluídos", 400, "INVALID_STATUS");
  }

  const confirmationToken = crypto.randomUUID();
  const confirmationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.service.update({
      where: { id: serviceId },
      data: {
        status: "COMPLETED",
        completedDate: new Date(),
        executionNotes: data.executionNotes ?? null,
        durationMinutes: data.durationMinutes ?? null,
        confirmationToken,
        confirmationTokenExpiresAt,
      },
    });

    if (data.equipmentNotes && data.equipmentNotes.length > 0) {
      for (const eq of data.equipmentNotes) {
        await tx.serviceEquipment.upsert({
          where: { serviceId_equipmentId: { serviceId, equipmentId: eq.equipmentId } },
          create: { serviceId, equipmentId: eq.equipmentId, notes: eq.note },
          update: { notes: eq.note },
        });
      }
    }

    return updated;
  });

  return { ...result, confirmationToken, confirmationLink: `/api/confirm/${confirmationToken}` };
}

export async function cancel(companyId: string, serviceId: string, data: { reason: string }) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");
  if (["COMPLETED", "CONFIRMED"].includes(service.status)) {
    throw new AppError("Não é possível cancelar um serviço já concluído ou confirmado", 409, "INVALID_STATUS");
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { status: "CANCELLED", cancelledReason: data.reason },
  });

  await createAuditLog({
    companyId, entityType: "Service", entityId: serviceId, action: "CANCEL",
    oldData: { status: service.status } as Record<string, unknown>,
    newData: { status: "CANCELLED", reason: data.reason } as Record<string, unknown>,
  });

  return updated;
}

export async function reschedule(companyId: string, serviceId: string, data: { scheduledAt: string }) {
  const newDate = new Date(data.scheduledAt);
  if (newDate <= new Date()) {
    throw new AppError("A nova data deve ser no futuro", 400, "INVALID_DATE");
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");
  if (!["SCHEDULED", "IN_PROGRESS"].includes(service.status)) {
    throw new AppError("Apenas serviços agendados ou em andamento podem ser reagendados", 400, "INVALID_STATUS");
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { scheduledAt: newDate, status: "SCHEDULED" },
  });

  await createAuditLog({
    companyId, entityType: "Service", entityId: serviceId, action: "RESCHEDULE",
    oldData: { scheduledAt: service.scheduledAt, status: service.status } as Record<string, unknown>,
    newData: { scheduledAt: data.scheduledAt, status: "SCHEDULED" } as Record<string, unknown>,
  });

  return updated;
}

export async function resendConfirmation(companyId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");
  if (service.status !== "COMPLETED") {
    throw new AppError("Apenas serviços concluídos podem ter confirmação reenviada", 400, "INVALID_STATUS");
  }

  const newToken = crypto.randomUUID();
  const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { confirmationToken: newToken, confirmationTokenExpiresAt: newExpiry },
  });

  return { ...updated, confirmationToken: newToken };
}

export async function getReport(companyId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    select: { id: true, serviceNumber: true, reportUrl: true },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");

  return {
    data: {
      id: service.id,
      serviceNumber: service.serviceNumber,
      reportUrl: service.reportUrl,
    },
  };
}

export async function addPhotos(companyId: string, serviceId: string, files: any[]) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    select: { id: true },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");

  if (!files || files.length === 0) {
    return { photos: [] };
  }

  const uploadDir = path.join(process.cwd(), "uploads", "services", serviceId);
  await fs.mkdir(uploadDir, { recursive: true });

  const createdPhotos = [];

  for (const file of files) {
    const buffer = await file.toBuffer();
    const ext = path.extname(file.filename) || ".jpg";
    const filename = `${crypto.randomUUID()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);

    const photo = await prisma.servicePhoto.create({
      data: {
        serviceId,
        url: `/uploads/services/${serviceId}/${filename}`,
        caption: null,
      },
    });

    createdPhotos.push(photo);
  }

  return { photos: createdPhotos };
}

export async function removePhoto(companyId: string, serviceId: string, photoId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    select: { id: true },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");

  const photo = await prisma.servicePhoto.findFirst({
    where: { id: photoId, serviceId },
  });

  if (!photo) throw new AppError("Foto não encontrada", 404, "NOT_FOUND");

  await prisma.servicePhoto.delete({ where: { id: photoId } });

  return { success: true };
}

export async function linkEquipment(companyId: string, serviceId: string, equipmentIds: string[]) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
    select: { id: true, customerId: true },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");

  const equipmentList = await prisma.equipment.findMany({
    where: { id: { in: equipmentIds }, companyId, customerId: service.customerId, deletedAt: null },
    select: { id: true },
  });

  const foundIds = new Set(equipmentList.map((e) => e.id));
  const missingIds = equipmentIds.filter((id) => !foundIds.has(id));

  if (missingIds.length > 0) {
    throw new AppError("Alguns equipamentos não pertencem ao cliente do serviço ou não existem", 400, "INVALID_EQUIPMENT");
  }

  await prisma.$transaction(
    equipmentIds.map((equipmentId) =>
      prisma.serviceEquipment.upsert({
        where: { serviceId_equipmentId: { serviceId, equipmentId } },
        create: { serviceId, equipmentId },
        update: {},
      }),
    ),
  );

  const linked = await prisma.serviceEquipment.findMany({
    where: { serviceId },
    include: { equipment: true },
  });

  return { equipment: linked };
}
