import type { ContactSubmission } from "../types/contact.js";
import { col, sanitizeDocs, stripUndefined } from "./helpers.js";

export async function createContactSubmission(
  doc: ContactSubmission
): Promise<void> {
  const c = await col("contacts");
  await c.doc(doc.id).set(stripUndefined(doc));
}

export async function getContactSubmissions(limit = 50): Promise<
  (ContactSubmission & { id: string })[]
> {
  const c = await col("contacts");
  const snap = await c.orderBy("createdAt", "desc").limit(Math.min(limit, 100)).get();
  return sanitizeDocs<ContactSubmission>(snap);
}
