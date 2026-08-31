import type { PostDoc } from "../types/post.js";
import { col, sanitizeDocs, stripUndefined } from "./helpers.js";

export async function getPosts(limit = 30): Promise<(PostDoc & { id: string })[]> {
  const c = await col("posts");
  const snap = await c.orderBy("createdAt", "desc").limit(Math.min(limit, 100)).get();
  return sanitizeDocs<PostDoc>(snap);
}

export async function findPostById(id: string): Promise<(PostDoc & { id: string }) | null> {
  const c = await col("posts");
  const doc = await c.doc(id).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as PostDoc), id: doc.id };
}

export async function createPost(doc: PostDoc): Promise<void> {
  const c = await col("posts");
  await c.doc(doc.id).set(stripUndefined(doc));
}

export async function bumpPostLikes(id: string, delta: number): Promise<void> {
  const c = await col("posts");
  const post = await findPostById(id);
  if (!post) return;
  await c.doc(id).update({ likes: Math.max(0, (post.likes || 0) + delta) });
}

export async function incrementPostShares(id: string): Promise<void> {
  const c = await col("posts");
  const post = await findPostById(id);
  if (!post) return;
  await c.doc(id).update({ shares: (post.shares || 0) + 1 });
}
