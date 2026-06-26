import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";

function mapEquipment(e: any) {
  return { ...e, status: e.isActive ? "ACTIVE" : "INACTIVE" };
}

async function verifyCustomer(companyId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, deletedAt: null },
    select: { id: true },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
  }
}

export async function list(
  companyId: string,
  customerId: string,
  filters: { isActive?: string; type?: string },
) {
  await verifyCustomer(companyId, customerId);

  const where: Record<string, unknown> = { companyId, customerId, deletedAt: null };

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === "true";
  }

  if (filters.type) {
    where.type = filters.type;
  }

  const items = await prisma.equipment.findMany({
    where: where as any,
    orderBy: { createdAt: "desc" },
  });

  return { data: items.map(mapEquipment) };
}

export async function create(
  companyId: string,
  customerId: string,
  data: {
    type: string;
    brand?: string;
    model?: string;
    capacity?: string;
    serialNumber?: string;
    location?: string;
    installationDate?: string;
    notes?: string;
  },
  userId: string,
) {
  await verifyCustomer(companyId, customerId);

  const equipment = await prisma.equipment.create({
    data: {
      companyId,
      customerId,
      type: data.type,
      brand: data.brand ?? null,
      model: data.model ?? null,
      capacity: data.capacity ?? null,
      serialNumber: data.serialNumber ?? null,
      location: data.location ?? null,
      installedAt: data.installationDate ? new Date(data.installationDate) : null,
      notes: data.notes ?? null,
    },
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "Equipment",
    entityId: equipment.id,
    action: "CREATE",
    newData: {
      type: equipment.type,
      brand: equipment.brand,
      model: equipment.model,
    } as Record<string, unknown>,
  });

  return mapEquipment(equipment);
}

export async function getById(companyId: string, customerId: string, equipmentId: string) {
  await verifyCustomer(companyId, customerId);

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, companyId, customerId, deletedAt: null },
  });

  if (!equipment) {
    throw new AppError("Equipamento não encontrado", 404, "NOT_FOUND");
  }

  const serviceHistory = await prisma.serviceEquipment.findMany({
    where: { equipmentId },
    take: 10,
    orderBy: { service: { scheduledAt: "desc" } },
    include: {
      service: {
        select: { id: true, serviceNumber: true, scheduledAt: true, status: true },
      },
    },
  });

  return { ...mapEquipment(equipment), serviceHistory };
}

export async function update(
  companyId: string,
  customerId: string,
  equipmentId: string,
  data: {
    type?: string;
    brand?: string;
    model?: string;
    capacity?: string;
    serialNumber?: string;
    location?: string;
    installationDate?: string;
    notes?: string;
  },
  userId: string,
) {
  await verifyCustomer(companyId, customerId);

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, companyId, customerId, deletedAt: null },
  });

  if (!equipment) {
    throw new AppError("Equipamento não encontrado", 404, "NOT_FOUND");
  }

  const oldData = {
    type: equipment.type,
    brand: equipment.brand,
    model: equipment.model,
  };

  const updated = await prisma.equipment.update({
    where: { id: equipmentId },
    data: {
      ...(data.type !== undefined && { type: data.type }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.installationDate !== undefined && { installedAt: new Date(data.installationDate) }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "Equipment",
    entityId: equipmentId,
    action: "UPDATE",
    oldData: oldData as Record<string, unknown>,
    newData: {
      type: updated.type,
      brand: updated.brand,
      model: updated.model,
    } as Record<string, unknown>,
  });

  return mapEquipment(updated);
}

export async function toggle(companyId: string, customerId: string, equipmentId: string) {
  await verifyCustomer(companyId, customerId);

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, companyId, customerId, deletedAt: null },
  });

  if (!equipment) {
    throw new AppError("Equipamento não encontrado", 404, "NOT_FOUND");
  }

  const updated = await prisma.equipment.update({
    where: { id: equipmentId },
    data: { isActive: !equipment.isActive },
  });

  await createAuditLog({
    companyId,
    entityType: "Equipment",
    entityId: equipmentId,
    action: equipment.isActive ? "DEACTIVATE" : "ACTIVATE",
    oldData: { isActive: equipment.isActive } as Record<string, unknown>,
    newData: { isActive: updated.isActive } as Record<string, unknown>,
  });

  return mapEquipment(updated);
}

export async function remove(companyId: string, customerId: string, equipmentId: string) {
  await verifyCustomer(companyId, customerId);

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, companyId, customerId, deletedAt: null },
  });

  if (!equipment) {
    throw new AppError("Equipamento não encontrado", 404, "NOT_FOUND");
  }

  await prisma.equipment.update({
    where: { id: equipmentId },
    data: { deletedAt: new Date(), isActive: false },
  });

  await createAuditLog({
    companyId,
    entityType: "Equipment",
    entityId: equipmentId,
    action: "DELETE",
    oldData: { type: equipment.type, brand: equipment.brand, model: equipment.model } as Record<string, unknown>,
  });
}
