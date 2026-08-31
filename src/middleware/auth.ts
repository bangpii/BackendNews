import type { NextFunction, Request, Response } from "express";
import { upsertGuest, findUserByIp } from "../models/userModel.js";
import { getClientIp } from "./ipResolver.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      guest?: { id: string; name: string; role: string; avatarHue: number; anonymous: boolean };
    }
  }
}

/**
 * Resolver identitas tamu (tanpa login). Memberi setiap IP identitas anonim
 * untuk komentar, reaksi, dan like. Tidak memblokir akses.
 */
export async function resolveGuest(req: Request, _res: Response, next: NextFunction) {
  try {
    const ip = getClientIp(req);
    const existing = await findUserByIp(ip);
    if (existing) {
      req.guest = {
        id: existing.id,
        name: existing.name,
        role: existing.role,
        avatarHue: existing.avatarHue,
        anonymous: existing.anonymous,
      };
    } else {
      const data = await upsertGuest(ip, {});
      if (data) {
        req.guest = {
          id: data.id,
          name: data.name,
          role: data.role,
          avatarHue: data.avatarHue,
          anonymous: data.anonymous,
        };
      }
    }
  } catch {
    // Jika storage gagal, lanjutkan tanpa identitas (jangan blokir pengunjung).
    req.guest = { id: "unknown", name: "Tamu Anonim", role: "Pengunjung", avatarHue: 90, anonymous: true };
  }
  next();
}
