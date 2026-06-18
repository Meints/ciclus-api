import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { parsePagination, buildSkip } from "../../utils/pagination";

export async function list(companyId: string, filters: { isActive?: string }, query: { page?: string; limit?: string }) {
  const pagination = parsePagination(query);
  const where: Record<string, unknown> = { companyId, deletedAt: null };

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === "true";
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where: where as any,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            services: {
              where: { createdAt: { gte: startOfMonth }, deletedAt: null },
            },
          },
        },
      },
    }),
    prisma.employee.count({ where: where as any }),
  ]);

  const mapped = employees.map((emp) => ({
    id: emp.id,
    companyId: emp.companyId,
    name: emp.name,
    email: emp.email,
    phone: emp.phone,
    isActive: emp.isActive,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
    servicesThisMonth: emp._count.services,
  }));

  return { employees: mapped, total };
}

export async function create(companyId: string, data: { name: string; email?: string; phone?: string }) {
  const employee = await prisma.employee.create({
    data: {
      companyId,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
    },
  });

  await createAuditLog({
    companyId,
    entityType: "Employee",
    entityId: employee.id,
    action: "CREATE",
    newData: { name: employee.name, email: employee.email, phone: employee.phone } as Record<string, unknown>,
  });

  return employee;
}

export async function getById(companyId: string, employeeId: string) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
    include: {
      services: {
        where: {
          scheduledAt: { gte: now, lte: sevenDaysFromNow },
          deletedAt: null,
        },
        orderBy: { scheduledAt: "asc" },
        include: {
          customer: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!employee) {
    throw new AppError("Funcionário não encontrado", 404, "NOT_FOUND");
  }

  return employee;
}

export async function update(companyId: string, employeeId: string, data: { name?: string; email?: string; phone?: string }) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });

  if (!employee) {
    throw new AppError("Funcionário não encontrado", 404, "NOT_FOUND");
  }

  const oldData = { name: employee.name, email: employee.email, phone: employee.phone };

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
    },
  });

  await createAuditLog({
    companyId,
    entityType: "Employee",
    entityId: employeeId,
    action: "UPDATE",
    oldData: oldData as Record<string, unknown>,
    newData: { name: updated.name, email: updated.email, phone: updated.phone } as Record<string, unknown>,
  });

  return updated;
}

export async function toggle(companyId: string, employeeId: string) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });

  if (!employee) {
    throw new AppError("Funcionário não encontrado", 404, "NOT_FOUND");
  }

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { isActive: !employee.isActive },
  });

  await createAuditLog({
    companyId,
    entityType: "Employee",
    entityId: employeeId,
    action: employee.isActive ? "DEACTIVATE" : "ACTIVATE",
    oldData: { isActive: employee.isActive } as Record<string, unknown>,
    newData: { isActive: updated.isActive } as Record<string, unknown>,
  });

  return updated;
}

export async function getServices(companyId: string, employeeId: string, filters: { dateStart?: string; dateEnd?: string; status?: string }, query: { page?: string; limit?: string }) {
  const pagination = parsePagination(query);
  const where: Record<string, unknown> = { companyId, employeeId, deletedAt: null };

  if (filters.dateStart || filters.dateEnd) {
    const scheduledAt: Record<string, Date> = {};
    if (filters.dateStart) {
      scheduledAt.gte = new Date(filters.dateStart);
    }
    if (filters.dateEnd) {
      scheduledAt.lte = new Date(filters.dateEnd);
    }
    where.scheduledAt = scheduledAt;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where: where as any,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { scheduledAt: "desc" },
      include: {
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, frequency: true } },
      },
    }),
    prisma.service.count({ where: where as any }),
  ]);

  return { services, total };
}

export async function getMonthlyServiceCount(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const employees = await prisma.employee.findMany({
    where: { companyId, deletedAt: null },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          services: {
            where: { createdAt: { gte: startOfMonth }, deletedAt: null },
          },
        },
      },
    },
  });

  return employees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    servicesThisMonth: emp._count.services,
  }));
}
