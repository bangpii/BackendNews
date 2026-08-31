import type { ReactionDoc } from "../types/reaction.js";
import { col, sanitizeDoc } from "./helpers.js";

export interface ReactionVoteDoc {
  id: string;
  ip: string;
  reaction: string;
  updatedAt: number;
}

export function reactionId(targetType: string, targetId: string): string {
  return `${targetType}:${targetId}`;
}

export async function getReaction(
  targetType: string,
  targetId: string
): Promise<(ReactionDoc & { id: string }) | null> {
  const c = await col("reactions");
  const doc = await c.doc(reactionId(targetType, targetId)).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as ReactionDoc), id: doc.id };
}

export async function setReactionCounts(
  targetType: string,
  targetId: string,
  counts: Record<string, number>
): Promise<void> {
  const c = await col("reactions");
  await c.doc(reactionId(targetType, targetId)).set(
    { targetType, targetId, counts, updatedAt: Date.now() },
    { merge: true }
  );
}

export async function getVote(
  targetType: string,
  targetId: string,
  ip: string
): Promise<ReactionVoteDoc | null> {
  const c = await col("reactionVotes");
  const id = `${reactionId(targetType, targetId)}:${ip}`;
  const doc = await c.doc(id).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as ReactionVoteDoc), id: doc.id };
}

export async function setVote(
  targetType: string,
  targetId: string,
  ip: string,
  reaction: string | null
): Promise<void> {
  const c = await col("reactionVotes");
  const id = `${reactionId(targetType, targetId)}:${ip}`;
  if (reaction === null) {
    await c.doc(id).delete();
    return;
  }
  await c.doc(id).set({ ip, reaction, updatedAt: Date.now() });
}

export { sanitizeDoc };
