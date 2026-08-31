import { z } from "zod";

export const commentBodySchema = z.object({
  body: z.string().trim().min(1, "Komentar tidak boleh kosong").max(1000, "Terlalu panjang"),
});
