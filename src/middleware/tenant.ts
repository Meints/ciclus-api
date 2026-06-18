import type { FastifyRequest, FastifyReply } from "fastify";

export function tenantResource<T extends { companyId: string }>(
  getResource: (request: FastifyRequest) => Promise<T | null>,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { companyId: string } | undefined;
    if (!user) {
      return reply.status(401).send({ message: "Não autenticado" });
    }

    const resource = await getResource(request);
    if (!resource || resource.companyId !== user.companyId) {
      return reply.status(404).send({ message: "Recurso não encontrado" });
    }
  };
}
