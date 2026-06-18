import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const toggleEmployeeSchema = z.object({});

export const employeesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  isActive: z.string().optional(),
});

export const employeeServicesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  status: z.string().optional(),
});
