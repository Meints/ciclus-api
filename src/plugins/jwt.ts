import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { env } from "../config/env";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string; // userId
      companyId: string; // tenant
      role: "OWNER" | "ADMIN" | "TECHNICIAN" | "SUPERADMIN";
      impersonating?: boolean;
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: import("fastify").FastifyRequest,
      reply: import("fastify").FastifyReply,
    ) => Promise<void>;
  }
}

export default fp(async (app) => {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
    cookie: {
      cookieName: "ciclus_token",
      signed: false,
    },
  });

  app.decorate("authenticate", async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ message: "Não autenticado" });
    }
  });
});
