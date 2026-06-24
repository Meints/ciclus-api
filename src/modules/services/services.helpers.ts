import { prisma } from "../../config/prisma";
import type { ServiceReportData } from "../../integrations/pdf/pdf.service";

export async function buildServiceReportData(serviceId: string): Promise<ServiceReportData> {
  const service = await prisma.service.findUniqueOrThrow({
    where: { id: serviceId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          niche: true,
          logoUrl: true,
          document: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      customer: {
        select: {
          name: true,
          address: true,
          document: true,
          documentType: true,
          email: true,
          phone: true,
        },
      },
      employee: { select: { name: true } },
      equipment: {
        include: {
          equipment: { select: { type: true, brand: true, model: true, location: true } },
        },
      },
      photos: {
        select: { url: true, caption: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return {
    serviceNumber: service.serviceNumber,
    serviceType: service.serviceType,
    scheduledAt: service.scheduledAt,
    completedDate: service.completedDate,
    durationMinutes: service.durationMinutes,
    status: service.status,
    technicianName: service.employee?.name ?? null,
    companyId: service.company.id,
    companyName: service.company.name,
    companyNiche: service.company.niche,
    companyLogo: service.company.logoUrl,
    companyDocument: service.company.document,
    companyAddress: service.company.address as Record<string, unknown> | null,
    companyPhone: service.company.phone,
    companyEmail: service.company.email,
    customerName: service.customer.name,
    customerAddress: service.customer.address as Record<string, unknown> | null,
    customerDocument: service.customer.document,
    customerDocumentType: service.customer.documentType,
    customerPhone: service.customer.phone,
    customerEmail: service.customer.email,
    createdAt: service.createdAt,
    amount: service.amount ? Number(service.amount) : null,
    notes: service.notes,
    equipment: service.equipment.map((se) => ({
      id: se.equipmentId,
      type: se.equipment.type,
      brand: se.equipment.brand,
      model: se.equipment.model,
      location: se.equipment.location,
      notes: se.notes,
    })),
    executionNotes: service.executionNotes,
    confirmedAt: service.confirmedAt,
    confirmedName: service.confirmedName,
    confirmedDocument: service.confirmedDocument,
    confirmedDocumentType: service.confirmedDocumentType,
    confirmedIp: service.confirmedIp,
    confirmedUserAgent: service.confirmedUserAgent,
    photos: service.photos.map((p) => ({ url: p.url, caption: p.caption })),
  };
}
