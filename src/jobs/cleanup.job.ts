import { prisma } from "../config/prisma";

export async function cleanupTokensJob(): Promise<void> {
  const now = new Date();

  const [expiredTokens] = await Promise.all([
    prisma.service.updateMany({
      where: {
        confirmationToken: { not: null },
        confirmationTokenExpiresAt: { lt: now },
      },
      data: {
        confirmationToken: null,
        confirmationTokenExpiresAt: null,
      },
    }),
  ]);

  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [anonymizedIps] = await Promise.all([
    prisma.service.updateMany({
      where: {
        confirmedAt: { lt: ninetyDaysAgo },
        confirmedIp: { not: null },
      },
      data: {
        confirmedIp: "0.0.0.0",
      },
    }),
  ]);

  console.log(`[cleanup] Tokens expirados limpos: ${expiredTokens.count}, IPs anonimizados: ${anonymizedIps.count}`);
}
