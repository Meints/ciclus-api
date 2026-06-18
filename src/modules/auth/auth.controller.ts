import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import * as authService from "./auth.service";

const cookieOptions = {
  path: "/",
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.body as { email: string; password: string };
  const result = await authService.login(email, password);

  const jwt = await reply.jwtSign({
    sub: result.user.id,
    companyId: result.user.companyId,
    role: result.user.role,
  });

  reply.setCookie("token", jwt, {
    ...cookieOptions,
    maxAge: env.JWT_EXPIRES_IN,
  });

  reply.setCookie("refresh_token", result.refreshToken, {
    ...cookieOptions,
    maxAge: env.REFRESH_TOKEN_EXPIRES_IN,
    path: "/auth/refresh",
  });

  return reply.status(200).send({ data: { user: result.user } });
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { sub: string; companyId: string };
  await authService.logout(user.sub, user.companyId);

  reply.clearCookie("token", { path: "/" });
  reply.clearCookie("refresh_token", { path: "/" });

  return reply.status(200).send({ success: true });
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

  const {
    passwordHash: _ph,
    refreshTokenHash: _rth,
    resetPasswordToken: _rpt,
    resetPasswordExpiresAt: _rpea,
    ...safeUser
  } = fullUser;

  return reply.status(200).send({ data: safeUser });
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const tokenCookie = request.cookies.token;
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

  reply.setCookie("token", jwt, {
    ...cookieOptions,
    maxAge: env.JWT_EXPIRES_IN,
  });

  return reply.status(200).send({ success: true });
}

export async function changePassword(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { sub: string };
  const { currentPassword, newPassword } = request.body as {
    currentPassword: string;
    newPassword: string;
  };

  await authService.changePassword(user.sub, currentPassword, newPassword);

  reply.clearCookie("token", { path: "/" });
  reply.clearCookie("refresh_token", { path: "/" });

  return reply.status(200).send({ success: true });
}

export async function forgotPassword(request: FastifyRequest, reply: FastifyReply) {
  const { email } = request.body as { email: string };
  await authService.forgotPassword(email);
  return reply.status(200).send({ success: true });
}

export async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  const { token, newPassword } = request.body as { token: string; newPassword: string };
  await authService.resetPassword(token, newPassword);
  return reply.status(200).send({ success: true });
}
