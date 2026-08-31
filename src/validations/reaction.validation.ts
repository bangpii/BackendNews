import { z } from "zod";

export const reactionBodySchema = z.object({
  value: z
    .enum(["senyum", "ceria", "ketawa", "marah", "sedih"])
    .optional()
    .nullable(),
});
