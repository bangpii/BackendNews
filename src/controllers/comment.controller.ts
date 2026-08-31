import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created, fail } from "../utils/response.js";
import { listArticleComments, listPostComments, addComment, likeComment, commentCount } from "../services/commentService.js";
import { findNewsById } from "../models/newsModel.js";
import { qs, qsInt, param } from "../utils/query.js";

export const getArticleComments = asyncHandler(async (req: Request, res: Response) => {
  const articleId = param(req, "id");
  const data = await listArticleComments(articleId, qsInt(req, "limit", 50));
  ok(res, data, { total: data.length });
});

export const getPostComments = asyncHandler(async (req: Request, res: Response) => {
  const postId = param(req, "id");
  const data = await listPostComments(postId, qsInt(req, "limit", 50));
  ok(res, data, { total: data.length });
});

export const postArticleComment = asyncHandler(async (req: Request, res: Response) => {
  const articleId = param(req, "id");
  const exists = await findNewsById(articleId);
  if (!exists) {
    fail(res, 404, "Berita tidak ditemukan");
    return;
  }
  const data = await addComment({
    articleId,
    body: req.body.body,
    user: req.guest!,
  });
  created(res, data);
});

export const postPostComment = asyncHandler(async (req: Request, res: Response) => {
  const postId = param(req, "id");
  const data = await addComment({
    postId,
    body: req.body.body,
    user: req.guest!,
  });
  created(res, data);
});

export const toggleCommentLike = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, "id");
  const action = qs(req, "action") || "like";
  const delta = action === "unlike" ? -1 : 1;
  const likes = await likeComment(id, delta);
  ok(res, { id, likes, liked: delta === 1 });
});

export const getArticleCommentCount = asyncHandler(async (req: Request, res: Response) => {
  const articleId = param(req, "id");
  const total = await commentCount(articleId);
  ok(res, { articleId, total });
});