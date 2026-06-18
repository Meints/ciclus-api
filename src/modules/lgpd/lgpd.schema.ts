import { z } from "zod";

export const consentSchema = z.object({
  accepted: z.literal(true),
});
