import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { upsertGuest } from "../models/userModel.js";
import { getClientIp } from "../middleware/ipResolver.js";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  ok(res, req.guest);
});

export const updateIdentity = asyncHandler(async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const data = await upsertGuest(ip, {
    name: req.body.name,
    role: req.body.role,
  });
  ok(res, data);
});
