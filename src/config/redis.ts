import Redis from "ioredis";
import { env } from "./env.js";

let client: Redis | null = null;

/**
 * Mengembalikan koneksi Redis jika diatur (REDIS_HOST terisi).
 * Mengembalikan null jika Redis tidak dipakai — antarmuka rate-limit
 * akan fallback ke in-memory store.
 */
export function getRedis(): Redis | null {
  if (!env.redisHost) return null;
  if (client) return client;
  client = new Redis({
    host: env.redisHost,
    port: env.redisPort,
    password: env.redisPassword || undefined,
    lazyConnect: false,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
  });
  return client;
}

export function redisConfigured(): boolean {
  return Boolean(env.redisHost);
}

export function closeRedis() {
  if (client) {
    client.disconnect();
    client = null;
  }
}
