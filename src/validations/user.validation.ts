import { z } from "zod";

export const userIdentitySchema = z.object({
  name: z.string().trim().max(40).optional(),
  role: z.string().trim().max(100).optional(),
});
