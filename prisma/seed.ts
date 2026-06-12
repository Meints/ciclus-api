import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "ciclus-seed-company" },
    create: {
      id: "ciclus-seed-company",
      name: "Ciclus",
    },
    update: {},
  });

  const passwordHash = await bcrypt.hash("admin123", 10);

  const users = [
    { name: "Cadu", email: "cadumeints0@gmail.com" },
    { name: "Arthur", email: "arthurmontandon08@gmail.com" },
    { name: "Victor", email: "victorvinicios@gmail.com" },
  ];

  for (const user of users) {
    await prisma.user.upsert({
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
  }

  console.log("Seed concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
