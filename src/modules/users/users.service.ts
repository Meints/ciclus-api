import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { parsePagination, buildSkip } from "../../utils/pagination";

const sensitiveFields = ["passwordHash", "refreshTokenHash", "resetPasswordToken", "resetPasswordExpiresAt"] as const;

type UserSensitive = (typeof sensitiveFields)[number];

export type UserWithoutSensitive<T> = T extends Array<infer U>
  ? Array<Omit<U, UserSensitive>>
  : Omit<T, UserSensitive>;

function excludeSensitive<T extends Record<string, unknown>>(user: T): Omit<T, UserSensitive> {
  const result = { ...user };
  for (const field of sensitiveFields) {
    delete result[field];
  }
  return result;
}

export async function list(companyId: string, filters: { role?: string; isActive?: string }, query: { page?: string; limit?: string }) {
  const pagination = parsePagination(query);
  const where: Record<string, unknown> = { companyId, deletedAt: null };

  if (filters.role) {
    where.role = filters.role;
  }
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === "true";
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: where as any,
      skip: buildSkip(pagination),
      take: pagination.limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: where as any }),
  ]);

  return { users: users.map((u) => excludeSensitive(u as unknown as Record<string, unknown>)), total };
}

export async function create(companyId: string, data: { name: string; email: string; role: string; password: string }, currentUserId: string, currentUserRole: string) {
  if (data.role === "OWNER") {
    throw new AppError("Não é permitido criar usuário com papel OWNER", 403, "FORBIDDEN");
  }
  if (currentUserRole === "ADMIN" && data.role === "ADMIN") {
    throw new AppError("Administradores não podem criar outros administradores", 403, "FORBIDDEN");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      companyId,
      name: data.name,
      email: data.email,
      role: data.role as "ADMIN" | "TECHNICIAN",
      passwordHash,
    },
  });

  await createAuditLog({
    companyId,
    userId: currentUserId,
    entityType: "User",
    entityId: user.id,
    action: "CREATE",
    newData: { name: user.name, email: user.email, role: user.role } as unknown as Record<string, unknown>,
  });

  return excludeSensitive(user as unknown as Record<string, unknown>);
}

export async function getById(companyId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404, "NOT_FOUND");
  }

  return excludeSensitive(user as unknown as Record<string, unknown>);
}

export async function update(companyId: string, userId: string, data: { name?: string; role?: "ADMIN" | "TECHNICIAN" | "OWNER" }, currentUserRole: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404, "NOT_FOUND");
  }

  if (currentUserRole === "ADMIN") {
    if (user.role === "OWNER" || data.role === "OWNER") {
      throw new AppError("Administradores não podem alterar papéis de/dono", 403, "FORBIDDEN");
    }
  }

  const oldData = { name: user.name, role: user.role };

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
    },
  });

  await createAuditLog({
    companyId,
    entityType: "User",
    entityId: userId,
    action: "UPDATE",
    oldData: oldData as unknown as Record<string, unknown>,
    newData: { name: updated.name, role: updated.role } as unknown as Record<string, unknown>,
  });

  return excludeSensitive(updated as unknown as Record<string, unknown>);
}

export async function toggle(companyId: string, userId: string, currentUserId: string) {
  if (userId === currentUserId) {
    throw new AppError("Não é possível desativar o próprio usuário", 400, "BAD_REQUEST");
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404, "NOT_FOUND");
  }

  if (user.isActive) {
    const activeOwnersCount = await prisma.user.count({
      where: { companyId, role: "OWNER", isActive: true, deletedAt: null },
    });

    if (activeOwnersCount === 1 && user.role === "OWNER") {
      throw new AppError("Não é possível desativar o único proprietário ativo", 400, "BAD_REQUEST");
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  await createAuditLog({
    companyId,
    userId: currentUserId,
    entityType: "User",
    entityId: userId,
    action: user.isActive ? "DEACTIVATE" : "ACTIVATE",
    oldData: { isActive: user.isActive } as unknown as Record<string, unknown>,
    newData: { isActive: updated.isActive } as unknown as Record<string, unknown>,
  });

  return excludeSensitive(updated as unknown as Record<string, unknown>);
}

export async function remove(companyId: string, userId: string, currentUserId: string) {
  if (userId === currentUserId) {
    throw new AppError("Não é possível excluir o próprio usuário", 400, "BAD_REQUEST");
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404, "NOT_FOUND");
  }

  if (user.role === "OWNER") {
    const ownerCount = await prisma.user.count({
      where: { companyId, role: "OWNER", deletedAt: null },
    });

    if (ownerCount <= 1) {
      throw new AppError("Não é possível excluir o único proprietário", 400, "BAD_REQUEST");
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), isActive: false },
  });

  await createAuditLog({
    companyId,
    userId: currentUserId,
    entityType: "User",
    entityId: userId,
    action: "DELETE",
    oldData: { name: user.name, email: user.email } as unknown as Record<string, unknown>,
  });
}
