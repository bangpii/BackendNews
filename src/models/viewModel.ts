import { col } from "./helpers.js";
import { findNewsById } from "./newsModel.js";

interface ViewLogDoc {
  id: string;
  articleId: string;
  ip: string;
  at: number;
  date: string;
}

export async function hasViewed(articleId: string, ip: string, windowMs: number): Promise<boolean> {
  const c = await col("viewLogs");
  const id = `${articleId}:${ip}`;
  const doc = await c.doc(id).get();
  if (!doc.exists) return false;
  const data = doc.data() as ViewLogDoc;
  return Date.now() - data.at < windowMs;
}

export async function recordView(articleId: string, ip: string): Promise<void> {
  const c = await col("viewLogs");
  const id = `${articleId}:${ip}`;
  await c.doc(id).set(
    { articleId, ip, at: Date.now(), date: new Date().toISOString().slice(0, 10) },
    { merge: true }
  );

  // Increment counter pada dokumen news menggunakan transaksi.
  const db = c.firestore;
  const newsRef = db.collection("news").doc(articleId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(newsRef);
    if (!snap.exists) return;
    const views = snap.get("views") ?? 0;
    tx.update(newsRef, { views: views + 1, updatedAt: Date.now() });
  });
}

export async function ensureNewsForView(articleId: string): Promise<boolean> {
  const news = await findNewsById(articleId);
  return Boolean(news);
}
