import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { parsePagination, buildSkip, buildMeta } from "../../utils/pagination";

export async function list(
  companyId: string,
  filters: {
    status?: string;
    customerId?: string;
    frequency?: string;
    dateStart?: string;
    dateEnd?: string;
  },
  query: { page?: string; limit?: string },
) {
  const pagination = parsePagination(query);
  const where: Record<string, unknown> = { companyId, deletedAt: null };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.frequency) {
    where.frequency = filters.frequency;
  }

  if (filters.dateStart || filters.dateEnd) {
    const nextServiceFilter: Record<string, Date> = {};
    if (filters.dateStart) nextServiceFilter.gte = new Date(filters.dateStart);
    if (filters.dateEnd) nextServiceFilter.lte = new Date(filters.dateEnd);
    where.nextServiceDate = nextServiceFilter;
  }

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where: where as any,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        services: {
          where: { deletedAt: null, status: "SCHEDULED" },
          orderBy: { scheduledAt: "asc" },
          take: 1,
          include: {
            employee: {
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
    prisma.contract.count({ where: where as any }),
  ]);

  const mapped = contracts.map((c) => {
    const firstService = c.services[0];
    return {
      ...c,
      responsible: firstService ? firstService.employee : null,
      services: undefined,
    };
  });

  return {
    data: mapped,
    meta: buildMeta(total, pagination),
  };
}

export async function create(
  companyId: string,
  data: {
    customerId: string;
    serviceType: string;
    frequency: string;
    startDate: string;
    endDate: string;
    amount: number;
    employeeId?: string;
    notes?: string;
  },
  userId: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { id: data.customerId, companyId, deletedAt: null },
    select: { id: true },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
  }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (startDate >= endDate) {
    throw new AppError(
      "Data de início deve ser anterior à data de término",
      400,
      "INVALID_DATES",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const contract = await tx.contract.create({
      data: {
        companyId,
        customerId: data.customerId,
        frequency: data.frequency as any,
        amount: data.amount,
        startDate,
        endDate,
        nextServiceDate: startDate,
        notes: data.notes ?? null,
      },
    });

    const serviceNumber = await getNextServiceNumberInTx(tx, companyId);

    const service = await tx.service.create({
      data: {
        serviceNumber,
        companyId,
        contractId: contract.id,
        customerId: data.customerId,
        serviceType: data.serviceType,
        scheduledAt: startDate,
        status: "SCHEDULED",
        amount: data.amount,
        employeeId: data.employeeId ?? null,
      },
    });

    return { contract, service };
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "Contract",
    entityId: result.contract.id,
    action: "CREATE",
    newData: {
      customerId: result.contract.customerId,
      frequency: result.contract.frequency,
      amount: result.contract.amount.toString(),
    } as Record<string, unknown>,
  });

  return result;
}

async function getNextServiceNumberInTx(
  tx: any,
  companyId: string,
): Promise<number> {
  const result: { last_service_number: number }[] = await tx.$queryRawUnsafe(
    `UPDATE companies SET last_service_number = last_service_number + 1 WHERE id = $1 RETURNING last_service_number`,
    companyId,
  );
  const row = result[0];
  if (!row) throw new Error("Falha ao gerar número de serviço");
  return row.last_service_number;
}

export async function getById(
  companyId: string,
  contractId: string,
  servicesQuery?: { page?: string; limit?: string },
) {
  const pagination = servicesQuery ? parsePagination(servicesQuery) : null;

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, companyId, deletedAt: null },
    include: {
      customer: true,
      services: {
        where: { deletedAt: null },
        orderBy: { scheduledAt: "desc" },
        ...(pagination ? { skip: buildSkip(pagination), take: pagination.limit } : { take: 50 }),
        include: {
          employee: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!contract) {
    throw new AppError("Contrato não encontrado", 404, "NOT_FOUND");
  }

  return contract;
}

export async function update(
  companyId: string,
  contractId: string,
  data: Record<string, unknown>,
  userId: string,
) {
  const { customerId: _, ...safeData } = data;

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, companyId, deletedAt: null },
  });

  if (!contract) {
    throw new AppError("Contrato não encontrado", 404, "NOT_FOUND");
  }

  const oldData: Record<string, unknown> = {};
  const newData: Record<string, unknown> = {};
  const updateData: Record<string, unknown> = {};

  for (const key of Object.keys(safeData)) {
    if (safeData[key] !== undefined) {
      const value =
        key === "startDate" || key === "endDate"
          ? new Date(safeData[key] as string)
          : safeData[key];
      oldData[key] = (contract as Record<string, unknown>)[key];
      newData[key] = safeData[key];
      updateData[key] = value;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return contract;
  }

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: updateData as any,
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "Contract",
    entityId: contractId,
    action: "UPDATE",
    oldData,
    newData,
  });

  return updated;
}

export async function cancel(
  companyId: string,
  contractId: string,
  data: { reason: string },
  userId: string,
) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, companyId, deletedAt: null },
  });

  if (!contract) {
    throw new AppError("Contrato não encontrado", 404, "NOT_FOUND");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.contract.update({
      where: { id: contractId },
      data: { status: "CANCELLED" },
    });

    await tx.service.updateMany({
      where: {
        contractId,
        status: { in: ["SCHEDULED", "RESCHEDULED"] },
      },
      data: {
        status: "CANCELLED",
        cancelledReason: data.reason,
      },
    });

    return updated;
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "Contract",
    entityId: contractId,
    action: "CANCEL",
    oldData: { status: contract.status } as Record<string, unknown>,
    newData: { status: "CANCELLED", reason: data.reason } as Record<string, unknown>,
  });

  return result;
}
