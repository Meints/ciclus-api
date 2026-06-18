import type { FastifyRequest, FastifyReply } from "fastify";

export function authorize(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { role: string } | undefined;
    if (!user) {
      return reply.status(401).send({ message: "Não autenticado" });
    }
    if (!allowedRoles.includes(user.role)) {
      return reply.status(403).send({ message: "Acesso não autorizado" });
    }
  };
}
