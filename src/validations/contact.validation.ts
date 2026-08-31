import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  email: z.string().trim().email("Email tidak valid").max(200),
  message: z.string().trim().min(1, "Pesan wajib diisi").max(3000),
});
