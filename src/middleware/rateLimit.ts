import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import slowDown from "express-slow-down";
import { getClientIp } from "./ipResolver.js";
import { env } from "../config/env.js";

/**
 * Anti-DDoS / Anti-DOS forcing.
 * - Global limiter: batasan agresif per IP di seluruh API.
 * - Slow-down: memperlambat respons setelah melewati ambang, tanpa memblokir total.
 */
export const globalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: (_req, res) => {
    res
      .status(429)
      .json({ ok: false, error: "Terlalu banyak permintaan. Silakan coba lagi nanti." });
  },
  skipSuccessfulRequests: false,
});

export const globalSlowDown = slowDown({
  windowMs: env.rateLimitWindowMs,
  delayAfter: Math.floor(env.rateLimitMax / 2),
  delayMs: () => 500,
  keyGenerator: (req) => getClientIp(req),
});

/** Limiter lebih ketat untuk aksi tulis (komentar, reaksi, post, kontak). */
export const strictLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: (_req, res) => {
    res.status(429).json({ ok: false, error: "Aksi terlalu sering. Coba lagi nanti." });
  },
});
