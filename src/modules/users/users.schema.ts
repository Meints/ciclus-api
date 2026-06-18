import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "TECHNICIAN"]),
  password: z.string().min(6),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(["ADMIN", "TECHNICIAN", "OWNER"]).optional(),
});

export const toggleUserSchema = z.object({});

export const usersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.string().optional(),
  isActive: z.string().optional(),
});
