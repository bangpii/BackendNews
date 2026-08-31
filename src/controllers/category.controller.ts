import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { getCategories } from "../models/categoryModel.js";
import { getNews } from "../models/newsModel.js";
import { qsInt, param } from "../utils/query.js";

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  ok(res, await getCategories());
});

export const newsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const slug = param(req, "slug");
  const limit = qsInt(req, "limit", 20);
  const data = await getNews({ category: slug, limit });
  ok(res, data);
});
