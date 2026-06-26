import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { maskDocument, type CustomerRaw } from "../../lib/mask";
import { parsePagination, buildSkip, buildMeta } from "../../utils/pagination";
import { validateDocument, formatCpf, formatCnpj } from "../../utils/document";
import { checkCustomerLimit } from "../company/plan-limits";

function mapCustomerToFrontend(c: any, role: string) {
  const base = {
    id: c.id,
    companyId: c.companyId,
    legalName: c.name,
    tradeName: c.fantasyName ?? null,
    name: c.name,
    fantasyName: c.fantasyName ?? null,
    documentType: c.documentType ?? null,
    phone: c.phone ?? null,
    notes: c.notes ?? null,
    status: c.isActive ? "ACTIVE" : "INACTIVE",
    isActive: c.isActive,
    contractsCount: c._count?.contracts ?? 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };

  const email = c.email ?? null;

  if (role === "TECHNICIAN") {
    return {
      ...base,
      document: c.document ? maskDocument(c.document, (c.documentType as "CPF" | "CNPJ") || "CNPJ") : null,
      email,
      address: null,
    };
  }

  return {
    ...base,
    document: c.document ? maskDocument(c.document, (c.documentType as "CPF" | "CNPJ") || "CNPJ") : null,
    email,
    address: c.address ?? null,
  };
}

export async function list(
  companyId: string,
  filters: { isActive?: string; search?: string },
  query: { page?: string; pageSize?: string },
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

  const mapped = customers.map((c) => mapCustomerToFrontend(c, userRole));

  return {
    data: mapped,
    meta: buildMeta(total, pagination),
  };
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
  await checkCustomerLimit(companyId);

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

  return mapCustomerToFrontend(customer, "OWNER");
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

  return {
    ...mapCustomerToFrontend(customer, "OWNER"),
    contracts: customer.contracts,
    services: customer.services,
    equipment: customer.equipment,
  };
}

export async function reveal(companyId: string, customerId: string, userId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, deletedAt: null },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
  }

  await createAuditLog({
    companyId,
    userId,
    entityType: "Customer",
    entityId: customerId,
    action: "SENSITIVE_DATA_REVEAL",
    newData: { revealedAt: new Date().toISOString() },
  });

  return {
    document: customer.document,
    email: customer.email,
  };
}

export async function update(
  companyId: string,
  customerId: string,
  data: Record<string, unknown>,
  userId: string,
) {
  const allowedFields = ["name", "fantasyName", "email", "phone", "address", "notes"];

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, deletedAt: null },
  });

  if (!customer) {
    throw new AppError("Cliente não encontrado", 404, "NOT_FOUND");
  }

  const oldData: Record<string, unknown> = {};
  const updateData: Record<string, unknown> = {};

  for (const key of Object.keys(data)) {
    if (data[key] !== undefined && allowedFields.includes(key)) {
      oldData[key] = (customer as Record<string, unknown>)[key];
      updateData[key] = data[key];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return mapCustomerToFrontend(customer, "OWNER");
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
    newData: updateData,
  });

  return mapCustomerToFrontend(updated, "OWNER");
}

export async function toggle(companyId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, deletedAt: null },
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

  return mapCustomerToFrontend(updated, "OWNER");
}

export async function remove(companyId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, companyId, deletedAt: null },
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
