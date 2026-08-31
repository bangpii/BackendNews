import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Membungkus handler async agar error otomatis diteruskan ke middleware error.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}
