import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { getClientIp } from "../middleware/ipResolver.js";

export const whoAmI = asyncHandler(async (req: Request, res: Response) => {
  ok(res, {
    guest: req.guest,
    ip: getClientIp(req),
    message: "Akses tamu tanpa login — aman & ter-identifikasi anonim.",
  });
});
