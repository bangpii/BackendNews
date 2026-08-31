import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";
import { env } from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let dbPromise: Promise<{
  firestore: admin.firestore.Firestore;
  auth: admin.auth.Auth;
}> | null = null;

/**
 * Resolusi lokasi file kredensial. Karena module bisa dijalankan dari `src/`
 * (dev/tsx) atau dari `dist/` (bundle), kita coba beberapa lokasi relatif:
 * 1. folder kerja (process.cwd) — andalan saat dijalankan dari root backend
 * 2. satu level ke atas dari module (berlaku utk dev dari src/config)
 * 3. dua level ke atas (berlaku utk bundle di dist/config)
 */
function resolveCredentialPath(rel: string): string {
  const candidates = [
    path.resolve(process.cwd(), rel),
    path.resolve(__dirname, "..", rel),
    path.resolve(__dirname, "..", "..", rel),
  ];
  return candidates.find((p) => existsSync(p)) ?? candidates[candidates.length - 1]!;
}

async function readCredential(): Promise<string> {
  if (env.firebaseServiceAccount) return env.firebaseServiceAccount;
  const credPath = resolveCredentialPath(env.firebaseCredentialPath);
  return readFile(credPath, "utf-8");
}

/**
 * Inisialisasi Firebase Admin (idempotent/lazy). Pastikan dipanggil sekali
 * sebelum model dipakai; setiap panggilan mengembalikan promise yang sama.
 */
export function ensureFirebase() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const raw = await readCredential();
      const serviceAccount = JSON.parse(raw);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: env.firebaseStorageBucket || undefined,
        });
      }
      return { firestore: admin.firestore(), auth: admin.auth() };
    })();
  }
  return dbPromise;
}

export async function getFirestore(): Promise<admin.firestore.Firestore> {
  return (await ensureFirebase()).firestore;
}

export async function getAuth(): Promise<admin.auth.Auth> {
  return (await ensureFirebase()).auth;
}
