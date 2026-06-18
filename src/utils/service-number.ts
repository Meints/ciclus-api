import { prisma } from "../config/prisma";

export async function getNextServiceNumber(companyId: string): Promise<number> {
  const result = await prisma.$queryRawUnsafe<{ last_service_number: number }[]>(
    `UPDATE companies SET last_service_number = last_service_number + 1 WHERE id = $1 RETURNING last_service_number`,
    companyId,
  );
  const row = result[0];
  if (!row) throw new Error("Falha ao gerar número de serviço");
  return row.last_service_number;
}

export async function getNextServiceNumberInTx(tx: any, companyId: string): Promise<number> {
  const result: { last_service_number: number }[] = await tx.$queryRawUnsafe(
    `UPDATE companies SET last_service_number = last_service_number + 1 WHERE id = $1 RETURNING last_service_number`,
    companyId,
  );
  const row = result[0];
  if (!row) throw new Error("Falha ao gerar número de serviço");
  return row.last_service_number;
}
