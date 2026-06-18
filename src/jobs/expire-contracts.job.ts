import { prisma } from "../config/prisma";

export async function expireContractsJob(): Promise<void> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { count: expired } = await prisma.contract.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: now },
      deletedAt: null,
    },
    data: { status: "EXPIRED" },
  });

  const { count: aboutToExpire } = await prisma.contract.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { gte: now, lte: sevenDaysFromNow },
      deletedAt: null,
    },
    data: { status: "ABOUT_TO_EXPIRE" },
  });

  console.log(`[expire-contracts] Expirados: ${expired}, Prestes a expirar: ${aboutToExpire}`);
}
