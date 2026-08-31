import express, { type Express } from "express";
import compression from "compression";
import helmet from "helmet";
import hpp from "hpp";
import routes from "./routes/index.js";
import { globalLimiter, globalSlowDown } from "./middleware/rateLimit.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";
import { resolveGuest } from "./middleware/auth.js";

/** Hapus key yg mengandung operator (`$`/`.`) dari body (anti NoSQL/param injection). */
function sanitizeDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const clean = k.replace(/^\$/g, "").replace(/\./g, "_");
      out[clean] = sanitizeDeep(v);
    }
    return out;
  }
  return value;
}

/**
 * Buka aplikasi Express lengkap: keamanan, limit anti-DoS,
 * identitas tamu, dan seluruh route API.
 */
export function buildApp(app: Express): Express {
  app.disable("x-powered-by");

  // Trust proxy agar req.ip & x-forwarded-for benar saat di Vercel/Koyeb.
  app.set("trust proxy", 1);

  app.use(compression());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // Parse body hanya untuk JSON (multipart ditangani multer di route tertentu).
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // Proteksi query parameter pollution + sanitasi body (anti NoSQL injection).
  app.use(hpp());
  app.use((req, _res, next) => {
    if (req.body && typeof req.body === "object") req.body = sanitizeDeep(req.body) as typeof req.body;
    next();
  });

  // Anti-DoS: per-lambatan dulu, lalu batasi global.
  app.use(globalSlowDown);
  app.use(globalLimiter);

  // Identitas tamu anonim utk seluruh API.
  app.use(resolveGuest);

  // Route utama.
  app.use("/api", routes);

  // Fallback & error.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}