import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import { getClientIp } from "../middleware/ipResolver.js";
import { param } from "../utils/query.js";
import { recordView, hasViewed, ensureNewsForView } from "../models/viewModel.js";
import { findNewsById } from "../models/newsModel.js";

const VIEW_WINDOW_MS = 30 * 60 * 1000;

export const incrementView = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, "id");
  const exists = await ensureNewsForView(id);
  if (!exists) {
    fail(res, 404, "Berita tidak ditemukan");
    return;
  }

  const ip = getClientIp(req);
  const news = await findNewsById(id);
  const current = news?.views ?? 0;

  const already = await hasViewed(id, ip, VIEW_WINDOW_MS);
  if (already) {
    ok(res, { id, views: current, counted: false });
    return;
  }

  await recordView(id, ip);
  ok(res, { id, views: current + 1, counted: true });
});

export const getViews = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, "id");
  const news = await findNewsById(id);
  if (!news) {
    fail(res, 404, "Berita tidak ditemukan");
    return;
  }
  ok(res, { id, views: news.views ?? 0 });
});