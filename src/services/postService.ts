import type { PostDoc } from "../types/post.js";
import {
  createPost,
  findPostById,
  getPosts,
  bumpPostLikes,
  incrementPostShares,
} from "../models/postModel.js";
import { ApiError } from "../utils/apiError.js";
import type { SocialUser } from "../types/comment.js";

export interface CreatePostInput {
  content: string;
  tags?: string[];
  displayName?: string;
  media?: PostDoc["media"];
  user: SocialUser;
}

export async function listPosts(limit?: number) {
  return getPosts(limit);
}

export async function makeUserPost(input: CreatePostInput): Promise<PostDoc & { id: string }> {
  const content = input.content.trim();
  if (!content) throw new ApiError(400, "Konten tidak boleh kosong");
  if (input.content.length > 2000) throw new ApiError(400, "Konten terlalu panjang (maks 2000 karakter)");

  const tags = (input.tags ?? [])
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 10);

  const doc: PostDoc = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user: input.user,
    content,
    tags,
    likes: 0,
    comments: [],
    shares: 0,
    createdAt: Date.now(),
    displayName: input.displayName?.trim() || undefined,
    media: input.media,
  };
  await createPost(doc);
  return { ...doc, id: doc.id };
}

export async function reactToPost(postId: string, delta: 1 | -1): Promise<number> {
  const post = await findPostById(postId);
  if (!post) throw new ApiError(404, "Postingan tidak ditemukan");
  await bumpPostLikes(postId, delta);
  return Math.max(0, (post.likes || 0) + delta);
}

export async function sharePost(postId: string): Promise<void> {
  const post = await findPostById(postId);
  if (!post) throw new ApiError(404, "Postingan tidak ditemukan");
  await incrementPostShares(postId);
}
