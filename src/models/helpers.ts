import type { Query, QuerySnapshot } from "firebase-admin/firestore";
import type { DocumentData } from "firebase-admin/firestore";
import { getFirestore } from "../config/firebase.js";

export type Firestore = Awaited<ReturnType<typeof getFirestore>>;

export async function col(name: string) {
  return (await getFirestore()).collection(name);
}

export function sanitizeDoc<T>(doc: { id: string; data: () => DocumentData }): T & { id: string } {
  return { ...(doc.data() as T), id: doc.id };
}

export function sanitizeDocs<T>(snap: QuerySnapshot): (T & { id: string })[] {
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }));
}

export async function listQuery<T>(q: Query): Promise<(T & { id: string })[]> {
  const snap = await q.limit(100).get();
  return sanitizeDocs<T>(snap);
}

/** Rekursif hapus key bernilai `undefined` (agar aman utk Firestore set). */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

export function normalizedDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}