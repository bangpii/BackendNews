import { z } from "zod";

const tagsSchema = z.preprocess((v) => {
  if (v === undefined || v === null) return undefined;
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* abaikan — lanjut split koma */
    }
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(v)];
}, z.array(z.string().trim().max(30)).max(10).optional());

export const createPostSchema = z.object({
  content: z.string().trim().min(1, "Konten tidak boleh kosong").max(2000, "Terlalu panjang"),
  tags: tagsSchema,
  displayName: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v : undefined),
    z.string().trim().max(40).optional()
  ),
});

export const postCommentSchema = z.object({
  body: z.string().trim().min(1, "Komentar tidak boleh kosong").max(1000, "Terlalu panjang"),
});