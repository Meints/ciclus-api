import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { maskCustomerForTechnician, maskDocument, maskEmail, type CustomerRaw } from "../../lib/mask";
import { parsePagination, buildSkip, buildMeta } from "../../utils/pagination";
import { getNextServiceNumber } from "../../utils/service-number";
import { generateServiceReport } from "../../integrations/pdf/pdf.service";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env";

function formatAddress(address: Record<string, unknown> | null | undefined): string {
  if (!address) return "";
  const parts: string[] = [];
  if (address.street) parts.push(String(address.street));
  if (address.number) parts.push(String(address.number));
  if (address.neighborhood) parts.push(String(address.neighborhood));
  if (address.city) parts.push(String(address.city));
  if (address.state) parts.push(String(address.state));
  return parts.join(", ");
}

function formatServiceResponse(service: any) {
  const customer = service.customer ?? {};
  const employee = service.employee ?? {};

  const equipmentIds = (service.equipment ?? []).map((se: any) => se.equipmentId);
  const equipmentDetails = (service.equipment ?? []).map((se: any) => {
    const eq = se.equipment ?? {};
    return {
      id: eq.id,
      type: eq.type,
      brand: eq.brand,
      model: eq.model,
      location: eq.location,
      capacity: eq.capacity,
      status: eq.status,
    };
  });

  const photoUrls = (service.photos ?? []).map((p: any) => p.url);

  const execution = service.completedDate
    ? {
        notes: service.executionNotes ?? "",
        photoUrls,
        completedAt: service.completedDate instanceof Date
          ? service.completedDate.toISOString()
          : String(service.completedDate),
      }
    : undefined;

  const confirmationStatus = service.confirmedAt ? "CONFIRMED" : "PENDING";
  const confirmationLink = service.confirmationToken
    ? `/confirm/${service.confirmationToken}`
    : null;

  return {
    id: service.id,
    companyId: service.companyId,
    contractId: service.contractId ?? "",
    customerId: service.customerId,
    customerName: customer.name ?? "",
    customerAddress: formatAddress(customer.address as Record<string, unknown> | null | undefined),
    customerPhone: customer.phone ?? null,
    serviceType: service.serviceType ?? "",
    scheduledDate: service.scheduledAt instanceof Date
      ? service.scheduledAt.toISOString()
      : String(service.scheduledAt),
    employeeId: service.employeeId ?? null,
    employeeName: employee.name ?? null,
    status: service.status,
    equipmentIds,
    equipmentDetails: equipmentDetails.length > 0 ? equipmentDetails : undefined,
    execution,
    reportPdfUrl: service.reportUrl ?? null,
    confirmationStatus,
    confirmationToken: service.confirmationToken ?? null,
    confirmationLink,
    confirmationExpiresAt: service.confirmationTokenExpiresAt instanceof Date
      ? service.confirmationTokenExpiresAt.toISOString()
      : service.confirmationTokenExpiresAt ?? null,
    confirmedAt: service.confirmedAt instanceof Date
      ? service.confirmedAt.toISOString()
      : service.confirmedAt ?? null,
    createdAt: service.createdAt instanceof Date
      ? service.createdAt.toISOString()
      : String(service.createdAt),
    updatedAt: service.updatedAt instanceof Date
      ? service.updatedAt.toISOString()
      : String(service.updatedAt),
  };
}

export async function create(
  companyId: string,
  data: {
    contractId?: string;
    customerId: string;
    serviceType: string;
    scheduledDate: string;
    employeeId?: string;
    equipmentIds?: string[];
  },
) {
  const scheduledAt = new Date(data.scheduledDate);
  if (isNaN(scheduledAt.getTime())) {
    throw new AppError("Data agendada inválida", 400, "INVALID_DATE");
  }

  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, companyId, deletedAt: null },
    select: { id: true },
  });
  if (!customer) throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");

  if (data.contractId) {
    const contract = await prisma.contract.findFirst({
      where: { id: data.contractId, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!contract) throw new AppError("Contrato não encontrado", 404, "NOT_FOUND");
  }

  const serviceNumber = await getNextServiceNumber(companyId);
  const amount = data.contractId
    ? await prisma.contract.findFirst({
        where: { id: data.contractId },
        select: { amount: true },
      }).then((c) => c?.amount ?? null)
    : null;

  const service = await prisma.service.create({
    data: {
      serviceNumber,
      companyId,
      contractId: data.contractId ?? null,
      customerId: data.customerId,
      scheduledAt,
      status: "SCHEDULED",
      amount,
      employeeId: data.employeeId ?? null,
      serviceType: data.serviceType,
    },
    include: {
      customer: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } },
    },
  });

  if (data.equipmentIds && data.equipmentIds.length > 0) {
    await prisma.serviceEquipment.createMany({
      data: data.equipmentIds.map((equipmentId) => ({
        serviceId: service.id,
        equipmentId,
      })),
    });
  }

  await createAuditLog({
    companyId,
    entityType: "Service",
    entityId: service.id,
    action: "CREATE",
    newData: { serviceNumber, customerId: data.customerId, serviceType: data.serviceType },
  });

  return formatServiceResponse(service);
}

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

  return {
    data: services.map(formatServiceResponse),
    meta: buildMeta(total, pagination),
  };
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

  let masked: Record<string, unknown>;

  if (userRole === "TECHNICIAN") {
    masked = maskCustomerForTechnician(customer) as unknown as Record<string, unknown>;
  } else {
    masked = {
      ...customer,
      document: customer.document
        ? maskDocument(customer.document, (customer.documentType as "CPF" | "CNPJ") || "CNPJ")
        : null,
      email: customer.email ? maskEmail(customer.email) : null,
    };
  }

  return formatServiceResponse({ ...service, customer: masked });
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

export async function revert(companyId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");
  if (service.status !== "IN_PROGRESS") {
    throw new AppError("Apenas serviços em andamento podem ser revertidos", 400, "INVALID_STATUS");
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: { status: "SCHEDULED" },
  });

  await createAuditLog({
    companyId, entityType: "Service", entityId: serviceId, action: "UPDATE",
    oldData: { status: "IN_PROGRESS" } as Record<string, unknown>,
    newData: { status: "SCHEDULED" } as Record<string, unknown>,
  });

  return updated;
}

export async function reopen(companyId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");
  if (service.status !== "COMPLETED") {
    throw new AppError("Apenas serviços concluídos podem ser reabertos", 400, "INVALID_STATUS");
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: {
      status: "IN_PROGRESS",
      completedDate: null,
      executionNotes: null,
      durationMinutes: null,
      reportUrl: null,
    },
  });

  await createAuditLog({
    companyId, entityType: "Service", entityId: serviceId, action: "UPDATE",
    oldData: { status: "COMPLETED" } as Record<string, unknown>,
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

  const full = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      customer: { select: { name: true, address: true } },
      employee: { select: { name: true } },
      company: { select: { name: true, niche: true, logoUrl: true } },
      equipment: {
        include: {
          equipment: { select: { type: true, brand: true, model: true, location: true } },
        },
      },
    },
  });

  const reportUrl = full
    ? await generateServiceReport(serviceId, {
        serviceNumber: full.serviceNumber,
        serviceType: full.serviceType,
        scheduledAt: full.scheduledAt,
        completedDate: full.completedDate,
        durationMinutes: full.durationMinutes,
        status: full.status,
        technicianName: full.employee?.name ?? null,
        companyId: full.companyId,
        companyName: full.company.name,
        companyNiche: full.company.niche,
        companyLogo: full.company.logoUrl,
        customerName: full.customer.name,
        customerAddress: full.customer.address as Record<string, unknown> | null,
        equipment: full.equipment.map((se) => ({
          type: se.equipment.type,
          brand: se.equipment.brand,
          model: se.equipment.model,
          location: se.equipment.location,
          notes: se.notes,
        })),
        executionNotes: full.executionNotes,
      })
    : "";

  if (reportUrl) {
    await prisma.service.update({
      where: { id: serviceId },
      data: { reportUrl: reportUrl },
    });
  }

  return { ...result, confirmationToken, confirmationLink: `/confirm/${confirmationToken}`, reportPdfUrl: reportUrl || null };
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

export async function generatePdf(companyId: string, serviceId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, companyId, deletedAt: null },
  });

  if (!service) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");
  if (service.status !== "COMPLETED") {
    throw new AppError("Apenas serviços concluídos podem gerar PDF", 400, "INVALID_STATUS");
  }

  const full = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      customer: { select: { name: true, address: true } },
      employee: { select: { name: true } },
      company: { select: { name: true, niche: true, logoUrl: true } },
      equipment: {
        include: {
          equipment: { select: { type: true, brand: true, model: true, location: true } },
        },
      },
    },
  });

  if (!full) throw new AppError("Serviço não encontrado", 404, "NOT_FOUND");

  const reportUrl = await generateServiceReport(serviceId, {
    serviceNumber: full.serviceNumber,
    serviceType: full.serviceType,
    scheduledAt: full.scheduledAt,
    completedDate: full.completedDate,
    durationMinutes: full.durationMinutes,
    status: full.status,
    technicianName: full.employee?.name ?? null,
    companyId: full.companyId,
    companyName: full.company.name,
    companyNiche: full.company.niche,
    companyLogo: full.company.logoUrl,
    customerName: full.customer.name,
    customerAddress: full.customer.address as Record<string, unknown> | null,
    equipment: full.equipment.map((se) => ({
      type: se.equipment.type,
      brand: se.equipment.brand,
      model: se.equipment.model,
      location: se.equipment.location,
      notes: se.notes,
    })),
    executionNotes: full.executionNotes,
  });

  if (!reportUrl) {
    throw new AppError("Falha ao gerar o PDF. Verifique a configuração do storage.", 500, "PDF_GENERATION_FAILED");
  }

  await prisma.service.update({
    where: { id: serviceId },
    data: { reportUrl },
  });

  return { reportPdfUrl: reportUrl };
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
