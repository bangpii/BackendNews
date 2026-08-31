import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import { getClientIp } from "../middleware/ipResolver.js";
import { param } from "../utils/query.js";
import { getReaction, setReactionCounts, getVote, setVote } from "../models/reactionModel.js";
import { findNewsById } from "../models/newsModel.js";
import { findPostById } from "../models/postModel.js";
import { findCommentById } from "../models/commentModel.js";

const ALLOWED = new Set(["senyum", "ceria", "ketawa", "marah", "sedih"]);

async function targetExists(type: string, id: string): Promise<boolean> {
  if (type === "article") return Boolean(await findNewsById(id));
  if (type === "post") return Boolean(await findPostById(id));
  if (type === "comment") return Boolean(await findCommentById(id));
  return false;
}

export const react = asyncHandler(async (req: Request, res: Response) => {
  const type = param(req, "type");
  const id = param(req, "id");
  const value: string | null = req.body?.value ?? null;

  if (!ALLOWED.has(value ?? "")) {
    fail(res, 400, "Reaksi tidak valid");
    return;
  }
  if (!(await targetExists(type, id))) {
    fail(res, 404, "Target tidak ditemukan");
    return;
  }

  const ip = getClientIp(req);
  const current = await getReaction(type, id);
  const counts: Record<string, number> = current?.counts ?? {};

  const existingVote = await getVote(type, id, ip);

  const removeReaction = value !== null && existingVote?.reaction === value;

  if (removeReaction) {
    counts[value!] = Math.max(0, (counts[value!] || 0) - 1);
    await setVote(type, id, ip, null);
  } else {
    if (existingVote?.reaction) {
      const old = existingVote.reaction;
      if (counts[old]) counts[old] = Math.max(0, (counts[old] || 0) - 1);
    }
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
      await setVote(type, id, ip, value);
    }
  }

  await setReactionCounts(type, id, counts);
  ok(res, { targetType: type, targetId: id, counts });
});

export const getReactions = asyncHandler(async (req: Request, res: Response) => {
  const type = param(req, "type");
  const id = param(req, "id");
  const current = await getReaction(type, id);
  ok(res, { targetType: type, targetId: id, counts: current?.counts ?? {} });
});