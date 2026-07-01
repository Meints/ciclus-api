import type { FastifyRequest } from "fastify";

/**
 * O rewrite do Vercel para a API não preserva a cadeia original do
 * X-Forwarded-For, então request.ip acaba resolvendo para o IP do
 * Cloudflare em vez do cliente final. CF-Connecting-IP é definido
 * pelo Cloudflare com o IP real do visitante e sobrevive a esse hop.
 */
export function getClientIp(request: FastifyRequest): string {
  const cfConnectingIp = request.headers["cf-connecting-ip"];
  if (typeof cfConnectingIp === "string" && cfConnectingIp.length > 0) {
    return cfConnectingIp;
  }
  return request.ip;
}
