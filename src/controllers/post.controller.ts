import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created, fail } from "../utils/response.js";
import { listPosts, makeUserPost, reactToPost, sharePost } from "../services/postService.js";
import { addComment } from "../services/commentService.js";
import { findPostById } from "../models/postModel.js";
import { uploadMediaFile } from "../services/mediaService.js";
import { qs, qsInt, param } from "../utils/query.js";

export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPosts(qsInt(req, "limit", 30));
  ok(res, data);
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const media = await resolveMediaFromRequest(req);
  const data = await makeUserPost({
    content: req.body.content,
    tags: req.body.tags,
    displayName: req.body.displayName,
    media,
    user: req.guest!,
  });
  created(res, data);
});

export const likePost = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, "id");
  const action = qs(req, "action") || "like";
  const delta = action === "unlike" ? -1 : 1;
  const likes = await reactToPost(id, delta);
  ok(res, { id, likes, liked: delta === 1 });
});

export const addPostComment = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, "id");
  const exists = await findPostById(id);
  if (!exists) {
    fail(res, 404, "Postingan tidak ditemukan");
    return;
  }
  const data = await addComment({ postId: id, body: req.body.body, user: req.guest! });
  created(res, data);
});

export const sharePostCtrl = asyncHandler(async (req: Request, res: Response) => {
  const id = param(req, "id");
  await sharePost(id);
  ok(res, { id, shared: true });
});

async function resolveMediaFromRequest(req: Request) {
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) {
    return undefined;
  }
  return uploadMediaFile({
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
  });
}