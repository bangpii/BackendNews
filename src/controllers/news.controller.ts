import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, fail } from "../utils/response.js";
import { getNews, getHero, getTerkini, getTrending, searchNews, findNewsById } from "../models/newsModel.js";
import { syncNews } from "../services/newsService.js";
import { qs, qsInt, param } from "../utils/query.js";

export const listNews = asyncHandler(async (req: Request, res: Response) => {
  const category = qs(req, "category");
  const limit = qsInt(req, "limit", 20);
  const cursor = qs(req, "cursor");
  const search = qs(req, "search");

  if (search) {
    const data = await searchNews(search, limit);
    ok(res, data);
    return;
  }

  const data = await getNews({ category, limit, cursor });
  ok(res, data);
});

export const newsDetail = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, "id");
  const news = await findNewsById(id);
  if (!news) {
    fail(res, 404, "Berita tidak ditemukan");
    return;
  }
  ok(res, news);
});

export const heroNews = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getHero(3);
  ok(res, data);
});

export const terkiniNews = asyncHandler(async (req: Request, res: Response) => {
  const limit = qsInt(req, "limit", 40);
  const data = await getTerkini(limit);
  ok(res, data);
});

export const trendingNews = asyncHandler(async (req: Request, res: Response) => {
  const limit = qsInt(req, "limit", 6);
  const data = await getTrending(limit);
  ok(res, data);
});

export const refreshSync = asyncHandler(async (_req: Request, res: Response) => {
  const result = await syncNews();
  ok(res, result, { message: "Sinkronisasi berita selesai" });
});