import type { Request } from "express";

/**
 * Mengambil IP klien dengan aman. Saat di belakang proxy (Vercel) gunakan
 * X-Forwarded-For; fallback ke req.socket.remoteAddress.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    return xff.split(",")[0]!.trim();
  }
  const fwd = req.headers["x-real-ip"];
  if (typeof fwd === "string" && fwd.trim()) return fwd.trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export function maskIp(ip: string): string {
  return ip.replace(/[^0-9a-zA-Z]/g, "");
}
