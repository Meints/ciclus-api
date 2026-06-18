import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  fantasyName: z.string().optional(),
  documentType: z.enum(["CPF", "CNPJ"]),
  document: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.any().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().optional(),
  fantasyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.any().optional(),
  notes: z.string().optional(),
});

export const toggleCustomerSchema = z.object({});

export const customersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  isActive: z.string().optional(),
  search: z.string().optional(),
});
