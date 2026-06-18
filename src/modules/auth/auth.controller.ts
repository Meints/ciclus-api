import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import * as authService from "./auth.service";
import { validateOrThrow } from "../../lib/validate";
import { loginSchema } from "./dtos/login.dto";
import { changePasswordSchema } from "./dtos/change-password.dto";
import { forgotPasswordSchema } from "./dtos/forgot-password.dto";
import { resetPasswordSchema } from "./dtos/reset-password.dto";

const COOKIE_NAME = "ciclus_token";

const cookieOptions = {
  path: "/",
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

function mapUser(user: {
  id: string; name: string; email: string; role: string; isActive: boolean;
  createdAt: Date; updatedAt: Date;
  company?: { name: string; niche: string | null; logoUrl: string | null } | null;
  companyId?: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: user.company?.name ?? "",
    niche: user.company?.niche ?? null,
    avatarUrl: user.company?.logoUrl ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = validateOrThrow(loginSchema, request.body);
  const result = await authService.login(email, password);

  const jwt = await reply.jwtSign({
    sub: result.user.id,
    companyId: result.user.companyId,
    role: result.user.role,
  });

  reply.setCookie(COOKIE_NAME, jwt, {
    ...cookieOptions,
    maxAge: env.JWT_EXPIRES_IN,
  });

  reply.setCookie("refresh_token", result.refreshToken, {
    ...cookieOptions,
    maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
    path: "/auth/refresh",
  });

  const user = await prisma.user.findUnique({
    where: { id: result.user.id },
    include: { company: true },
  });

  return reply.status(200).send({
    data: {
      user: user ? mapUser(user as never) : null,
      accessToken: jwt,
    },
  });
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { sub: string; companyId: string };
  await authService.logout(user.sub, user.companyId);

  reply.clearCookie(COOKIE_NAME, { path: "/" });
  reply.clearCookie("refresh_token", { path: "/" });

  return reply.status(204).send();
}

export async function me(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { sub: string };
  const fullUser = await prisma.user.findUnique({
    where: { id: user.sub },
    include: { company: true },
  });

  if (!fullUser) {
    return reply.status(404).send({ message: "Usuário não encontrado" });
  }

  return reply.status(200).send({ data: mapUser(fullUser as never) });
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const tokenCookie = request.cookies.ciclus_token;
  const refreshTokenCookie = request.cookies.refresh_token;

  if (!tokenCookie || !refreshTokenCookie) {
    return reply.status(401).send({ message: "Token não encontrado" });
  }

  let decoded: { sub: string };
  try {
    decoded = request.server.jwt.decode<{ sub: string }>(tokenCookie) as { sub: string };
  } catch {
    return reply.status(401).send({ message: "Token inválido" });
  }

  const result = await authService.refresh(decoded.sub, refreshTokenCookie);

  const jwt = await reply.jwtSign({
    sub: result.user.id,
    companyId: result.user.companyId,
    role: result.user.role,
  });

  reply.setCookie(COOKIE_NAME, jwt, {
    ...cookieOptions,
    maxAge: env.JWT_EXPIRES_IN,
  });

  return reply.status(200).send({ success: true });
}

export async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { sub: string };
  const { currentPassword, newPassword } = validateOrThrow(changePasswordSchema, request.body);

  await authService.changePassword(user.sub, currentPassword, newPassword);

  reply.clearCookie(COOKIE_NAME, { path: "/" });
  reply.clearCookie("refresh_token", { path: "/" });

  return reply.status(204).send();
}

export async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
  const { email } = validateOrThrow(forgotPasswordSchema, request.body);
  await authService.forgotPassword(email);
  return reply.status(200).send({ success: true });
}

export async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  const { token, newPassword } = validateOrThrow(resetPasswordSchema, request.body);
  await authService.resetPassword(token, newPassword);
  return reply.status(200).send({ success: true });
}
