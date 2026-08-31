import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { created } from "../utils/response.js";
import { submitContact } from "../services/contactService.js";
import { getClientIp } from "../middleware/ipResolver.js";

export const sendContact = asyncHandler(async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const data = await submitContact(
    { name: req.body.name, email: req.body.email, message: req.body.message },
    ip
  );
  created(res, { id: data.id, sent: data.sent });
});
