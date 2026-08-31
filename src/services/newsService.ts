import type { NewsDoc } from "../types/news.js";
import { saveNews, existsNews } from "../models/newsModel.js";
import { seedCategoriesIfEmpty } from "../models/categoryModel.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

const BASE = "https://berita-indo-api-next.vercel.app";

/**
 * Sumber API Berita Indo (gratis, tanpa key, update tiap hari)
 * dipetakan ke kategori internal.
 */
const SOURCES: { path: string; category: string; source: string }[] = [
  { path: "/api/antara-news/terkini", category: "nasional", source: "Antara" },
  { path: "/api/tempo-news/nasional", category: "nasional", source: "Tempo" },
  { path: "/api/cnn-news/nasional", category: "nasional", source: "CNN Indonesia" },
  { path: "/api/cnn-news/ekonomi", category: "ekonomi", source: "CNN Indonesia" },
  { path: "/api/cnbc-news/market", category: "ekonomi", source: "CNBC Indonesia" },
  { path: "/api/cnn-news/teknologi", category: "teknologi", source: "CNN Indonesia" },
  { path: "/api/tempo-news/tekno", category: "teknologi", source: "Tempo" },
  { path: "/api/cnn-news/olahraga", category: "olahraga", source: "CNN Indonesia" },
  { path: "/api/tempo-news/bola", category: "olahraga", source: "Tempo" },
  { path: "/api/cnn-news/internasional", category: "internasional", source: "CNN Indonesia" },
  { path: "/api/tempo-news/dunia", category: "internasional", source: "Tempo" },
  { path: "/api/cnn-news/hiburan", category: "hiburan", source: "CNN Indonesia" },
];

interface RawArticle {
  title?: string;
  link?: string;
  url?: string;
  image?: string;
  imageUrl?: string;
  content?: string;
  description?: string;
  pubDate?: string;
  isoDate?: string;
}

function makeId(url: string): string {
  // id stabil dari URL agar sync idempotent.
  const clean = url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]/g, "_");
  return (clean || `n_${Date.now()}`).slice(0, 120);
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalDate(raw?: string): { iso: Date | null; dateStr: string | null } {
  if (!raw) return { iso: null, dateStr: null };
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return { iso: null, dateStr: null };
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return { iso: d, dateStr: `${y}-${m}-${day}` };
}

function mapArticle(
  raw: RawArticle,
  source: string,
  category: string
): NewsDoc | null {
  const url = raw.link || raw.url;
  if (!url) return null;

  const { iso, dateStr } = normalDate(raw.isoDate || raw.pubDate);
  const excerpt = stripTags(raw.description || raw.content || "").slice(0, 300);

  return {
    id: makeId(url),
    title: stripTags(raw.title || "").slice(0, 300),
    excerpt,
    content: stripTags(raw.content || raw.description || ""),
    image: raw.image || raw.imageUrl || undefined,
    source,
    sourceUrl: url,
    sourceType: "api",
    category,
    tags: [category, source],
    publishedAt: iso ? iso.toISOString() : new Date().toISOString(),
    publishedAtDate: dateStr ?? new Date().toISOString().slice(0, 10),
    views: 0,
    featured: false,
    live: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

async function fetchSource(s: { path: string; category: string; source: string }) {
  try {
    const res = await fetch(`${BASE}${s.path}`, {
      signal: AbortSignal.timeout(15_000),
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      logger.warn(`[news-sync] ${s.path} → HTTP ${res.status}`);
      return 0;
    }
    const json = (await res.json()) as { data?: RawArticle[] };
    const items = Array.isArray(json.data) ? json.data : [];
    let saved = 0;
    for (const item of items) {
      const mapped = mapArticle(item, s.source, s.category);
      if (!mapped) continue;
      const known = await existsNews(mapped.id);
      if (known) continue;
      await saveNews(mapped);
      saved++;
    }
    logger.info(`[news-sync] ${s.path} → ${saved} baru, total ${items.length}`);
    return saved;
  } catch (err) {
    logger.warn(`[news-sync] gagal ${s.path}: ${(err as Error).message}`);
    return 0;
  }
}

/** Sinkronkan berita dari API eksternal ke Firestore (update pertama kali). */
export async function syncNews(): Promise<{ total: number; added: number }> {
  await seedCategoriesIfEmpty();

  let added = 0;
  const total = SOURCES.length;
  // Eksekusi terbatas paralel untuk menghindari overload.
  const concurrency = 4;
  for (let i = 0; i < SOURCES.length; i += concurrency) {
    const chunk = SOURCES.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map(fetchSource));
    added += results.reduce((a, b) => a + b, 0);
  }
  return { total, added };
}

export async function seedNewsOnce(): Promise<void> {
  // Seed dilakukan sekali saat pertama memakai route berita (jika DB kosong).
  const { getNews } = await import("../models/newsModel.js");
  const sample = await getNews({ limit: 1 });
  if (sample.length > 0) return;
  logger.info("[news-sync] DB kosong, mulai seed...");
  await syncNews();
}
