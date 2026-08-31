import type { Query } from "firebase-admin/firestore";
import type { NewsDoc } from "../types/news.js";
import { col, listQuery, sanitizeDocs, stripUndefined, normalizedDate, startOfToday } from "./helpers.js";

export async function findNewsById(id: string): Promise<(NewsDoc & { id: string }) | null> {
  const c = await col("news");
  const doc = await c.doc(id).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as NewsDoc), id: doc.id };
}

/**
 * Ambil daftar berita diurutkan terbaru. Kategori/cursor diffilter di memori
 * agar tidak butuh composite index Firestore (query range+order lintas field).
 */
export async function getNews(params: {
  category?: string;
  limit?: number;
  cursor?: string;
}): Promise<(NewsDoc & { id: string })[]> {
  const c = await col("news");
  let q: Query = c.orderBy("publishedAt", "desc");
  if (params.cursor) {
    const snap = await c.doc(params.cursor).get();
    if (snap.exists) q = q.startAfter(snap);
  }

  const lim = Math.min(Math.max(Number(params.limit) || 20, 1), 60);
  const fetch = lim * 4;
  const result = await q.limit(Math.min(fetch, 400)).get();
  let docs = sanitizeDocs<NewsDoc>(result);

  if (params.category && params.category !== "semua") {
    docs = docs.filter((d) => d.category === params.category);
  }
  return docs.slice(0, lim);
}

export async function getTerkini(
  limit = 40
): Promise<(NewsDoc & { id: string })[]> {
  const c = await col("news");
  const todayStr = normalizedDate(startOfToday());
  const q = c.orderBy("publishedAt", "desc").limit(Math.min(limit * 4, 400));
  const result = await q.get();
  const docs = sanitizeDocs<NewsDoc>(result);
  return docs.filter((d) => d.publishedAtDate >= todayStr).slice(0, Math.min(limit, 60));
}

export async function getHero(
  limit = 3
): Promise<(NewsDoc & { id: string })[]> {
  const c = await col("news");
  const result = await c
    .orderBy("publishedAt", "desc")
    .limit(Math.min(limit, 20))
    .get();
  return sanitizeDocs<NewsDoc>(result);
}

export async function getTrending(
  limit = 6
): Promise<(NewsDoc & { id: string })[]> {
  const c = await col("news");
  const result = await c.orderBy("views", "desc").limit(Math.min(limit, 20)).get();
  return sanitizeDocs<NewsDoc>(result);
}

export async function searchNews(term: string, limit = 20) {
  const q = await col("news");
  const termLower = term.toLowerCase();
  const all = await q.orderBy("publishedAt", "desc").limit(200).get();
  const docs = sanitizeDocs<NewsDoc>(all);
  return docs
    .filter(
      (d) =>
        d.title.toLowerCase().includes(termLower) ||
        (d.excerpt || "").toLowerCase().includes(termLower) ||
        d.tags?.some((t) => t.toLowerCase().includes(termLower))
    )
    .slice(0, limit);
}

export async function saveNews(doc: NewsDoc): Promise<void> {
  const c = await col("news");
  await c.doc(doc.id).set(stripUndefined(doc), { merge: true });
}

export async function existsNews(id: string): Promise<boolean> {
  const c = await col("news");
  const doc = await c.doc(id).get();
  return doc.exists;
}

export async function listQueryRaw() {
  return col("news");
}
