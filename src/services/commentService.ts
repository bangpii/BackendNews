import type { CommentDoc, SocialUser } from "../types/comment.js";
import {
  createComment,
  getCommentsByArticle,
  getCommentsByPost,
  findCommentById,
  getCommentCountByArticle,
  assertArticleExists,
} from "../models/commentModel.js";
import { findPostById, appendPostComment } from "../models/postModel.js";
import { ApiError } from "../utils/apiError.js";

export interface AddCommentInput {
  body: string;
  user: SocialUser;
  articleId?: string;
  postId?: string;
}

export async function listArticleComments(articleId: string, limit?: number) {
  return getCommentsByArticle(articleId, limit);
}

export async function listPostComments(postId: string, limit?: number) {
  return getCommentsByPost(postId, limit);
}

export async function addComment(input: AddCommentInput): Promise<CommentDoc & { id: string }> {
  const body = input.body.trim();
  if (!body) throw new ApiError(400, "Komentar tidak boleh kosong");
  if (body.length > 1000) throw new ApiError(400, "Komentar terlalu panjang (maks 1000 karakter)");

  if (input.articleId) {
    const exists = await assertArticleExists(input.articleId);
    if (!exists) throw new ApiError(404, "Berita tidak ditemukan");
  }
  if (input.postId) {
    const post = await findPostById(input.postId);
    if (!post) throw new ApiError(404, "Postingan tidak ditemukan");
  }

  const doc: CommentDoc = {
    id: `cm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    articleId: input.articleId,
    postId: input.postId,
    user: input.user,
    body,
    likes: 0,
    createdAt: Date.now(),
  };
  await createComment(doc);
  // Simpan juga ke array inline `comments` pada post agar `/api/posts` (feed) menampilkannya.
  if (input.postId) {
    await appendPostComment(input.postId, {
      user: input.user,
      body,
      createdAt: doc.createdAt,
    });
  }
  return { ...doc, id: doc.id };
}

export async function likeComment(commentId: string, delta: 1 | -1): Promise<number> {
  const comment = await findCommentById(commentId);
  if (!comment) throw new ApiError(404, "Komentar tidak ditemukan");

  // update likes dengan read-modify-write sederhana
  const { getFirestore } = await import("../config/firebase.js");
  const db = await getFirestore();
  const target = (comment.likes ?? 0) + delta;
  await db.runTransaction(async (tx) => {
    const ref = db.collection("comments").doc(commentId);
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = snap.get("likes") ?? 0;
    tx.update(ref, { likes: Math.max(0, (cur as number) + delta) });
  });
  const fresh = await findCommentById(commentId);
  return fresh?.likes ?? Math.max(0, target);
}

export async function commentCount(articleId: string): Promise<number> {
  return getCommentCountByArticle(articleId);
}
