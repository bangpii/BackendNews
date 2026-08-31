import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

/**
 * Proteksi endpoint admin/sensitif dengan kunci akses.
 * Pemanggil lolos jika mengirim salah satu:
 *  - header `x-api-key` == ADMIN_API_KEY, atau
 *  - header `Authorization: Bearer <token>` == CRON_SECRET (dipakai Vercel Cron Jobs)
 * Jika keduanya tidak dikonfigurasi, endpoint ditolak (aman secara default).
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const headerKey = (req.header("x-api-key") ?? "").trim();
  const auth = (req.header("authorization") ?? "").trim();
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  const adminMatch = env.adminApiKey !== "" && headerKey === env.adminApiKey;
  const cronMatch = env.cronSecret !== "" && bearer === env.cronSecret;

  if (!adminMatch && !cronMatch) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }
  next();
}
