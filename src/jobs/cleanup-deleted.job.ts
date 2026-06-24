import { prisma } from "../config/prisma";

export async function cleanupDeletedJob(): Promise<void> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const where = { deletedAt: { lt: ninetyDaysAgo } } as const;

  const results: Record<string, number> = {};

  // Ordem: dependentes primeiro
  const photos = await prisma.servicePhoto.deleteMany({
    where: {
      service: { deletedAt: { lt: ninetyDaysAgo } },
    },
  });
  results.ServicePhoto = photos.count;

  const serviceEquipment = await prisma.serviceEquipment.deleteMany({
    where: {
      service: { deletedAt: { lt: ninetyDaysAgo } },
    },
  });
  results.ServiceEquipment = serviceEquipment.count;

  const services = await prisma.service.deleteMany({ where });
  results.Service = services.count;

  const equipment = await prisma.equipment.deleteMany({ where });
  results.Equipment = equipment.count;

  const contracts = await prisma.contract.deleteMany({ where });
  results.Contract = contracts.count;

  const customers = await prisma.customer.deleteMany({ where });
  results.Customer = customers.count;

  const employees = await prisma.employee.deleteMany({ where });
  results.Employee = employees.count;

  const users = await prisma.user.deleteMany({ where });
  results.User = users.count;

  const counts = Object.entries(results)
    .filter(([, count]) => count > 0)
    .map(([entity, count]) => `${entity}: ${count}`)
    .join(", ");

  console.log(`[cleanup-deleted] ${counts || "Nenhum registro removido"}`);
}
