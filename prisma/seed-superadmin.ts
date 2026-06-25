import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find any company to associate (superadmin needs a companyId due to FK)
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("No company found. Create one first.");

  const existing = await prisma.user.findFirst({ where: { email: "admin@ciclus.app" } });
  if (existing) {
    console.log("Superadmin already exists");
    return;
  }

  const passwordHash = await bcrypt.hash("Ciclus@2025!", 10);
  await prisma.user.create({
    data: {
      name: "Admin Ciclus",
      email: "admin@ciclus.app",
      passwordHash,
      role: "SUPERADMIN",
      companyId: company.id,
    },
  });
  console.log("Superadmin created: admin@ciclus.app / Ciclus@2025!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
