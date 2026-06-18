import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const company = await prisma.company.upsert({
    where: { id: "ciclus-seed-company" },
    create: {
      id: "ciclus-seed-company",
      name: "Ciclus",
      fantasyName: "Ciclus Tecnologia",
      email: "contato@ciclus.app",
      phone: "(31) 99999-0000",
      niche: "TECNOLOGIA",
      plan: "STARTER",
      address: { street: "Av. Afonso Pena", number: "1500", neighborhood: "Centro", city: "Belo Horizonte", state: "MG", zipCode: "30130-001" },
      dataConsentAt: new Date("2026-01-01"),
    },
    update: {},
  });

  const users = [
    { name: "Cadu", email: "cadumeints0@gmail.com" },
    { name: "Arthur", email: "arthurmontandon08@gmail.com" },
    { name: "Victor", email: "victorvinicios@gmail.com" },
  ];

  const createdUsers = [];
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: "OWNER",
        companyId: company.id,
      },
      update: {},
    });
    createdUsers.push(created);
  }

  const employee = await prisma.employee.upsert({
    where: { id: "ciclus-seed-employee-1" },
    create: {
      id: "ciclus-seed-employee-1",
      companyId: company.id,
      name: "João Técnico",
      email: "joao@ciclus.app",
      phone: "(31) 98888-0001",
    },
    update: {},
  });

  const customer = await prisma.customer.upsert({
    where: { id: "ciclus-seed-customer-1" },
    create: {
      id: "ciclus-seed-customer-1",
      companyId: company.id,
      name: "Empresa Cliente Ltda",
      fantasyName: "Cliente Exemplo",
      email: "cliente@exemplo.com",
      phone: "(31) 97777-0001",
      document: "11.222.333/0001-81",
      documentType: "CNPJ",
      address: { street: "Rua dos Limoeiros", number: "200", complement: "Sala 101", neighborhood: "Funcionários", city: "Belo Horizonte", state: "MG", zipCode: "30140-002" },
      notes: "Cliente de exemplo para desenvolvimento",
    },
    update: {},
  });

  const contract = await prisma.contract.upsert({
    where: { id: "ciclus-seed-contract-1" },
    create: {
      id: "ciclus-seed-contract-1",
      companyId: company.id,
      customerId: customer.id,
      frequency: "MONTHLY",
      amount: 1500.00,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      nextServiceDate: new Date("2026-07-01"),
      status: "ACTIVE",
      notes: "Contrato de manutenção mensal",
    },
    update: {},
  });

  const lastService = await prisma.service.upsert({
    where: { id: "ciclus-seed-service-1" },
    create: {
      id: "ciclus-seed-service-1",
      serviceNumber: 1,
      companyId: company.id,
      contractId: contract.id,
      customerId: customer.id,
      serviceType: "MANUTENÇÃO",
      scheduledAt: new Date("2026-06-15"),
      completedDate: new Date("2026-06-15"),
      status: "COMPLETED",
      amount: 1500.00,
      isPaid: true,
      employeeId: employee.id,
      confirmationToken: null,
      durationMinutes: 120,
      executionNotes: "Manutenção preventiva realizada com sucesso. Filtros trocados.",
    },
    update: {},
  });

  await prisma.$transaction([
    prisma.company.update({
      where: { id: company.id },
      data: { lastServiceNumber: 1 },
    }),
  ]);

  console.log("Seed concluído!");
  console.log(`  Empresa: ${company.name}`);
  console.log(`  Usuários: ${createdUsers.length}`);
  console.log(`  Funcionário: ${employee.name}`);
  console.log(`  Cliente: ${customer.name}`);
  console.log(`  Contrato: ${contract.id}`);
  console.log(`  OS: #${lastService.serviceNumber}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
