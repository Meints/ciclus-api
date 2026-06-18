import { z } from "zod";

export const upcomingQuerySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});
