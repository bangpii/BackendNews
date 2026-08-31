import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ ok: false, error: "Endpoint tidak ditemukan" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    res
      .status(err.status)
      .json({ ok: false, error: err.message, ...(err.details ? { details: err.details } : {}) });
    return;
  }

  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    res.status(400).json({ ok: false, error: "JSON tidak valid" });
    return;
  }

  // Multer file error
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string" &&
    ((err as { code?: string }).code ?? "").startsWith("LIMIT_")
  ) {
    res.status(400).json({ ok: false, error: "Ukuran atau jumlah file melebihi batas." });
    return;
  }

  logger.error("[errorHandler]", err);
  res.status(500).json({ ok: false, error: "Terjadi kesalahan pada server." });
}
