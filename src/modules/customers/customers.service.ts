import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { maskCustomerForList, type CustomerRaw } from "../../lib/mask";
import { parsePagination, buildSkip } from "../../utils/pagination";
import { validateDocument, formatCpf, formatCnpj } from "../../utils/document";

export async function list(
  companyId: string,
  filters: { isActive?: string; search?: string },
  query: { page?: string; limit?: string },
  userRole: string,
) {
  const pagination = parsePagination(query);
  const where: Record<string, unknown> = { companyId, deletedAt: null };

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === "true";
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { document: { contains: filters.search } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: where as any,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            contracts: {
              where: { status: "ACTIVE", deletedAt: null },
            },
          },
        },
      },
    }),
    prisma.customer.count({ where: where as any }),
  ]);

  let mapped;
  if (userRole === "OWNER" || userRole === "ADMIN") {
    mapped = customers.map((c) => ({
      ...maskCustomerForList(c as unknown as CustomerRaw),
      activeContracts: c._count.contracts,
    }));
  } else {
    mapped = customers.map((c) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
      activeContracts: c._count.contracts,
    }));
  }

  return { customers: mapped, total };
}

export async function create(
  companyId: string,
  data: {
    name: string;
    fantasyName?: string;
    documentType: "CPF" | "CNPJ";
    document: string;
    email?: string;
    phone?: string;
    address?: unknown;
    notes?: string;
  },
) {
  if (!validateDocument(data.document, data.documentType)) {
    throw new AppError(
      data.documentType === "CPF" ? "CPF inválido" : "CNPJ inválido",
      400,
      "INVALID_DOCUMENT",
    );
  }

  const rawDocument = data.document.replace(/\D/g, "");
  const formattedDocument =
    data.documentType === "CPF"
      ? formatCpf(rawDocument)
      : formatCnpj(rawDocument);

  const existing = await prisma.customer.findUnique({
    where: {
      companyId_document: { companyId, document: rawDocument },
    },
  });

  if (existing) {
    throw new AppError("Já existe um cliente com esse documento", 409, "CONFLICT");
  }

  const customer = await prisma.customer.create({
    data: {
      companyId,
      name: data.name,
      fantasyName: data.fantasyName ?? null,
      documentType: data.documentType,
      document: formattedDocument,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? undefined,
      notes: data.notes ?? null,
    },
  });

  await createAuditLog({
    companyId,
    entityType: "Customer",
    entityId: customer.id,
    action: "CREATE",
    newData: { name: customer.name, fantasyName: customer.fantasyName } as Record<string, unknown>,
  });

  return customer;
}

export async function getById(companyId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, deletedAt: null },
    include: {
      contracts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      services: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          contract: { select: { id: true, frequency: true } },
        },
      },
      equipment: {
        where: { isActive: true, deletedAt: null },
      },
    },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
  }

  return customer;
}

export async function update(
  companyId: string,
  customerId: string,
  data: Record<string, unknown>,
  userId: string,
) {
  const { document: _, documentType: __, ...safeData } = data;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
  }

  const oldData: Record<string, unknown> = {};
  const newData: Record<string, unknown> = {};
  const updateData: Record<string, unknown> = {};

  for (const key of Object.keys(safeData)) {
    if (safeData[key] !== undefined) {
      oldData[key] = (customer as Record<string, unknown>)[key];
      newData[key] = safeData[key];
      updateData[key] = safeData[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return customer;
  }

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: updateData as any,
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "Customer",
    entityId: customerId,
    action: "UPDATE",
    oldData,
    newData,
  });

  return updated;
}

export async function toggle(companyId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
  }

  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { isActive: !customer.isActive },
  });

  await createAuditLog({
    companyId,
    entityType: "Customer",
    entityId: customerId,
    action: customer.isActive ? "DEACTIVATE" : "ACTIVATE",
    oldData: { isActive: customer.isActive } as Record<string, unknown>,
    newData: { isActive: updated.isActive } as Record<string, unknown>,
  });

  return updated;
}

export async function remove(companyId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId },
    include: {
      contracts: {
        where: { status: "ACTIVE", deletedAt: null },
      },
    },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
  }

  if (customer.contracts.length > 0) {
    throw new AppError(
      "Não é possível excluir cliente com contratos ativos. Cancele ou aguarde o término dos contratos antes de excluir.",
      409,
      "HAS_ACTIVE_CONTRACTS",
    );
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { deletedAt: new Date(), isActive: false },
  });

  await createAuditLog({
    companyId,
    entityType: "Customer",
    entityId: customerId,
    action: "DELETE",
    oldData: { name: customer.name } as Record<string, unknown>,
  });
}
