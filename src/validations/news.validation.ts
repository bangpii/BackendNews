import { z } from "zod";

const newsQuerySchema = z.object({
  category: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
  cursor: z.string().trim().optional(),
  search: z.string().trim().max(100).optional(),
});

export const newsListQuery = newsQuerySchema;
export const newsIdParams = z.object({ id: z.string().trim().min(1) });
