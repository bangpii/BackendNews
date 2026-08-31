import type { GuestUserInput, StoredUser } from "../types/user.js";
import { col, sanitizeDoc, stripUndefined } from "./helpers.js";

export function hueFromString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) % 360;
  }
  return h;
}

export async function findUserByIp(ip: string): Promise<(StoredUser & { id: string }) | null> {
  const c = await col("users");
  const snap = await c.where("ip", "==", ip).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0] as unknown as { id: string; data(): StoredUser };
  return { ...doc.data(), id: doc.id };
}

export async function upsertGuest(
  ip: string,
  input: GuestUserInput = {}
): Promise<(StoredUser & { id: string }) | null> {
  const c = await col("users");
  const existing = await findUserByIp(ip);

  const now = Date.now();
  if (existing) {
    const data: StoredUser = {
      ...existing,
      name: input.name?.trim() || existing.name,
      role: input.role?.trim() || existing.role || "Pengunjung · tanpa akun",
      lastSeenAt: now,
    };
    await c.doc(existing.id).set(stripUndefined(data));
    return { ...data, id: existing.id };
  }

  const id = `guest_${ip.replace(/[^0-9a-zA-Z]/g, "")}`;
  const name = input.name?.trim() || "Tamu Anonim";
  const data: StoredUser = {
    id,
    ip,
    name,
    role: input.role?.trim() || "Pengunjung · tanpa akun",
    avatarHue: hueFromString(ip),
    anonymous: true,
    lastSeenAt: now,
    createdAt: now,
  };
  await c.doc(id).set(stripUndefined(data));
  return { ...data, id };
}

export { sanitizeDoc };
