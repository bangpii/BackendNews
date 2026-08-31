import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/apiError.js";

interface ValidateTarget {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(target: ValidateTarget) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (target.body) req.body = target.body.parse(req.body) as Record<string, unknown>;
      if (target.query) {
        const parsed = target.query.parse(req.query) as Record<string, unknown>;
        // Express 5 menolak assign ke req.query langsung; simpan di res.locals.
        _res.locals.parsedQuery = parsed;
      }
      if (target.params) {
        const parsed = target.params.parse(req.params) as Record<string, string>;
        req.params = parsed;
      }
      next();
    } catch (err) {
      const issues = (err as { issues?: unknown }).issues ?? undefined;
      next(new ApiError(400, "Validasi gagal", issues));
    }
  };
}