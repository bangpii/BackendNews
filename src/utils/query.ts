import type { Request } from "express";

/** Coerce Express 5 query value (string | ParsedQs | array) ke string. */
export function qs(req: Request, key: string): string | undefined {
  const v: unknown = req.query[key];
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : undefined;
  if (typeof v === "string") return v;
  return undefined;
}

export function qsInt(req: Request, key: string, def: number): number {
  const v = qs(req, key);
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined ? n : def;
}

/** Coerce Express 5 params value (string | string[] | undefined) ke string. */
export function param(req: Request, key: string): string {
  const v = req.params[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}