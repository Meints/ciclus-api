import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";
import { AppError } from "../../lib/app-error";
import { createAuditLog } from "../../lib/audit";
import { generateToken, hashToken, compareToken } from "../../lib/token";
import { sendForgotPasswordEmail } from "../../integrations/email/email.service";

export async function register(name: string, email: string, password: string, companyName: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("E-mail já cadastrado", 409, "EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const company = await prisma.company.create({
    data: { name: companyName },
  });

  const user = await prisma.user.create({
    data: { name, email, passwordHash, companyId: company.id, role: "OWNER" },
    include: { company: true },
  });

  const refreshToken = generateToken();
  const hashedRefreshToken = await hashToken(refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash: hashedRefreshToken, lastLoginAt: new Date() },
  });

  await createAuditLog({
    companyId: company.id,
    userId: user.id,
    entityType: "User",
    entityId: user.id,
    action: "REGISTER",
  });

  const { passwordHash: _ph, refreshTokenHash: _rth, resetPasswordToken: _rpt, resetPasswordExpiresAt: _rpea, ...safeUser } = user;
  return { user: safeUser, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (
    !user ||
    user.deletedAt !== null ||
    !user.isActive ||
    !user.company.isActive
  ) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    throw new AppError("Credenciais inválidas", 401, "UNAUTHORIZED");
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    throw new AppError("Credenciais inválidas", 401, "UNAUTHORIZED");
  }

  const refreshToken = generateToken();
  const hashedRefreshToken = await hashToken(refreshToken);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: hashedRefreshToken,
      lastLoginAt: new Date(),
    },
    include: { company: true },
  });

  await createAuditLog({
    companyId: user.companyId,
    userId: user.id,
    entityType: "User",
    entityId: user.id,
    action: "LOGIN",
  });

  const {
    passwordHash: _ph,
    refreshTokenHash: _rth,
    resetPasswordToken: _rpt,
    resetPasswordExpiresAt: _rpea,
    ...safeUser
  } = updatedUser;

  return { user: safeUser, refreshToken };
}

export async function logout(userId: string, companyId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });

  await createAuditLog({
    companyId,
    userId,
    entityType: "User",
    entityId: userId,
    action: "LOGOUT",
  });
}

export async function refresh(userId: string, rawRefreshToken: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.refreshTokenHash || !user.isActive || user.deletedAt) {
    throw new AppError("Token inválido", 401, "UNAUTHORIZED");
  }

  const valid = await compareToken(rawRefreshToken, user.refreshTokenHash);
  if (!valid) {
    throw new AppError("Token inválido", 401, "UNAUTHORIZED");
  }

  return { user };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("Usuário não encontrado", 404, "NOT_FOUND");
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError("Senha atual incorreta", 400, "INVALID_PASSWORD");
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHash,
      refreshTokenHash: null,
    },
  });

  await createAuditLog({
    companyId: user.companyId,
    userId,
    entityType: "User",
    entityId: userId,
    action: "CHANGE_PASSWORD",
  });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = generateToken();
  const hashedToken = await hashToken(token);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendForgotPasswordEmail(email, token);
}

export async function resetPassword(token: string, newPassword: string) {
  const users = await prisma.user.findMany({
    where: {
      resetPasswordToken: { not: null },
      resetPasswordExpiresAt: { gt: new Date() },
    },
  });

  let targetUser: (typeof users)[number] | null = null;
  for (const u of users) {
    if (u.resetPasswordToken && (await compareToken(token, u.resetPasswordToken))) {
      targetUser = u;
      break;
    }
  }

  if (!targetUser) {
    throw new AppError("Token inválido ou expirado", 400, "INVALID_TOKEN");
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: targetUser.id },
    data: {
      passwordHash: newHash,
      refreshTokenHash: null,
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    },
  });

  await createAuditLog({
    companyId: targetUser.companyId,
    userId: targetUser.id,
    entityType: "User",
    entityId: targetUser.id,
    action: "RESET_PASSWORD",
  });
}
