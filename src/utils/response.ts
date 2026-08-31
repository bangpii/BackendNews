import type { Response } from "express";

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.json({ ok: true, data, ...(meta ?? {}) });
}

export function created<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  res.status(201).json({ ok: true, data, ...(meta ?? {}) });
}

export function fail(
  res: Response,
  status: number,
  message: string,
  details?: unknown
) {
  res.status(status).json({ ok: false, error: message, ...(details ? { details } : {}) });
}
