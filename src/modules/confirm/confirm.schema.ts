import { z } from "zod";

export const confirmParamsSchema = z.object({
  token: z.string(),
});
