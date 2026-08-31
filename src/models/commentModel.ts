import type { CommentDoc } from "../types/comment.js";
import { col, sanitizeDoc, sanitizeDocs, stripUndefined } from "./helpers.js";
import { findNewsById } from "./newsModel.js";

export async function getCommentsByArticle(
  articleId: string,
  limit = 50
): Promise<(CommentDoc & { id: string })[]> {
  const c = await col("comments");
  const snap = await c.orderBy("createdAt", "desc").limit(200).get();
  return sanitizeDocs<CommentDoc>(snap).filter((d) => d.articleId === articleId).slice(0, Math.min(limit, 100));
}

export async function getCommentsByPost(
  postId: string,
  limit = 50
): Promise<(CommentDoc & { id: string })[]> {
  const c = await col("comments");
  const snap = await c.orderBy("createdAt", "desc").limit(200).get();
  return sanitizeDocs<CommentDoc>(snap).filter((d) => d.postId === postId).slice(0, Math.min(limit, 100));
}

export async function findCommentById(id: string): Promise<(CommentDoc & { id: string }) | null> {
  const c = await col("comments");
  const doc = await c.doc(id).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as CommentDoc), id: doc.id };
}

export async function createComment(doc: CommentDoc): Promise<void> {
  const c = await col("comments");
  await c.doc(doc.id).set(stripUndefined(doc));
}

export async function bumpCommentLikes(id: string, delta: number): Promise<void> {
  const c = await col("comments");
  const comment = await findCommentById(id);
  await c.doc(id).update({ likes: Math.max(0, (comment?.likes ?? 0) + delta) });
}

export async function getCommentCountByArticle(articleId: string): Promise<number> {
  const c = await col("comments");
  const snap = await c.where("articleId", "==", articleId).count().get();
  return snap.data().count ?? 0;
}

export async function assertArticleExists(articleId: string): Promise<boolean> {
  const article = await findNewsById(articleId);
  return Boolean(article);
}

export { sanitizeDoc };
