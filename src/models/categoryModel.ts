import type { CategoryKey } from "../types/news.js";
import { col } from "./helpers.js";

export interface CategoryDoc {
  id: string;
  name: string;
  slug: string;
}

export async function getCategories(): Promise<CategoryDoc[]> {
  const c = await col("categories");
  const snap = await c.orderBy("order").get();
  return snap.docs.map((d) => ({ ...(d.data() as CategoryDoc), id: d.id }));
}

export async function seedCategoriesIfEmpty() {
  const c = await col("categories");
  const snap = await c.limit(1).get();
  if (!snap.empty) return;

  const defs: { key: CategoryKey; order: number }[] = [
    { key: "nasional", order: 1 },
    { key: "ekonomi", order: 2 },
    { key: "teknologi", order: 3 },
    { key: "olahraga", order: 4 },
    { key: "internasional", order: 5 },
    { key: "hiburan", order: 6 },
  ];
  const batch = c.firestore.batch();
  for (const d of defs) {
    const ref = c.doc(d.key);
    batch.set(ref, { name: d.key, slug: d.key, order: d.order });
  }
  await batch.commit();
}
