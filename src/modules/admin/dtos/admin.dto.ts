import { z } from "zod";

const VALID_PLANS = ["FREE", "STARTER", "PRO", "BUSINESS"] as const;
const VALID_NICHES = ["AIR_CONDITIONING", "REFRIGERATION", "ELEVATORS", "ELECTRICAL", "HYDRAULIC", "GENERIC"] as const;

export const updateCompanyPlanSchema = z.object({
  plan: z.enum(VALID_PLANS, "Plano inválido"),
});

export const createCompanySchema = z.object({
  companyName: z.string().min(2, "Nome da empresa deve ter no mínimo 2 caracteres").max(100),
  ownerName: z.string().min(2, "Nome do responsável deve ter no mínimo 2 caracteres").max(100),
  ownerEmail: z.string().email("E-mail inválido"),
  niche: z.enum(VALID_NICHES).optional(),
  plan: z.enum(VALID_PLANS).optional(),
});

export const updateCompanyUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "TECHNICIAN"] as const, "Role inválido"),
});
