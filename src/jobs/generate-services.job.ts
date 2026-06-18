import { prisma } from "../config/prisma";
import { calcNextServiceDate } from "../utils/date";
import { getNextServiceNumber } from "../utils/service-number";

export async function generateServicesJob(): Promise<void> {
  const contracts = await prisma.contract.findMany({
    where: {
      status: "ACTIVE",
      nextServiceDate: { lte: new Date() },
      deletedAt: null,
    },
    include: { company: true },
  });

  let generated = 0;
  let errors = 0;

  for (const contract of contracts) {
    try {
      await prisma.$transaction(async (tx) => {
        const serviceNumber = await getNextServiceNumber(contract.companyId);

        await tx.service.create({
          data: {
            serviceNumber,
            companyId: contract.companyId,
            contractId: contract.id,
            customerId: contract.customerId,
            scheduledAt: contract.nextServiceDate!,
            status: "SCHEDULED",
            amount: contract.amount,
          },
        });

        const newNextDate = calcNextServiceDate(contract.nextServiceDate!, contract.frequency);

        await tx.contract.update({
          where: { id: contract.id },
          data: { nextServiceDate: newNextDate },
        });
      });

      generated++;
    } catch {
      errors++;
    }
  }

  console.log(`[generate-services] Geradas: ${generated}, Erros: ${errors}`);
}
