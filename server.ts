import "dotenv/config";
import { createServer } from "node:http";

import express, { type Express } from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";

import { buildApp } from "./src/app.js";
import { env } from "./src/config/env.js";
import { ensureFirebase } from "./src/config/firebase.js";
import { seedNewsOnce } from "./src/services/newsService.js";

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */

const PORT = env.port;
const HOST = env.host;
const FE_URL = env.feUrl;
const CORS_ORIGINS = env.corsOrigins;

/* ------------------------------------------------------------------ *
 * Integration status
 * ------------------------------------------------------------------ */

let cloudinaryStatus = "disabled";
let smtpStatus = "disabled";
let redisStatus = "disabled";
let firebaseStatus = "disabled";

/* ------------------------------------------------------------------ *
 * Lazy init functions (idempotent, called once)
 * ------------------------------------------------------------------ */

async function initFirebase() {
  try {
    await ensureFirebase();
    firebaseStatus = "connected";
  } catch (err) {
    firebaseStatus = "error";
    console.error("[initFirebase]", (err as Error)?.message || err);
  }
}

function ensureCloudinary() {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    cloudinaryStatus = "disabled";
    return;
  }
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  cloudinaryStatus = "connected";
}

let transport: nodemailer.Transporter | null = null;
function ensureSmtp() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    smtpStatus = "disabled";
    return null;
  }
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  smtpStatus = "configured";
  return transport;
}

/* ------------------------------------------------------------------ *
 * buildStatus
 * ------------------------------------------------------------------ */

function buildStatus() {
  return {
    ok: true,
    service: "bangpii-news-api",
    integrations: {
      firebase: firebaseStatus,
      redis: redisStatus,
      cloudinary: cloudinaryStatus,
      smtp: smtpStatus,
    },
    fe: FE_URL,
    time: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ *
 * Build Express app
 * ------------------------------------------------------------------ */

let seedPromise: Promise<void> | null = null;
function maybeSeed() {
  if (!seedPromise) {
    seedPromise = seedNewsOnce().catch(() => undefined);
  }
  return seedPromise;
}

export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin || CORS_ORIGINS.includes("*") || CORS_ORIGINS.includes(origin)) {
          cb(null, true);
        } else {
          cb(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  app.get("/", async (_req, res) => {
    ensureCloudinary();
    ensureSmtp();
    void initFirebase();
    void maybeSeed();
    res.json({ service: "bangpii-news-api", message: "Bangpii News API is running." });
  });

  app.get("/health", (_req, res) => {
    ensureCloudinary();
    ensureSmtp();
    void initFirebase().then(() => {
      res.json(buildStatus());
    });
  });

  // Pasang main security + routes dari src/app.ts
  buildApp(app);

  return app;
}

export { buildStatus };

/* ------------------------------------------------------------------ *
 * Local dev server (falls back if run directly)
 * ------------------------------------------------------------------ */

const isMain =
  process.argv[1] &&
  (await import("node:url"))
    .fileURLToPath(import.meta.url)
    .replace(/[\\/]+$/, "") ===
    process.argv[1].replace(/[\\/]+$/, "");

if (isMain) {
  const httpServer = createServer(createApp());
  httpServer.listen(PORT, HOST, () => {
    ensureCloudinary();
    ensureSmtp();
    void initFirebase().then(() => {
      void maybeSeed();
      printTable();
      console.log("API  →  http://" + HOST + ":" + PORT);
      console.log("FE   →  " + FE_URL);
    });
  });
}

function printTable() {
  const lines = [
    `Firebase    ${mark(firebaseStatus === "connected")} ${firebaseStatus}`,
    `Redis       ${mark(redisStatus === "ready")} ${redisStatus}`,
    `Cloudinary  ${mark(cloudinaryStatus === "connected")} ${cloudinaryStatus}`,
    `SMTP        ${mark(smtpStatus === "configured")} ${smtpStatus}`,
  ];
  const header = "Backend ready";
  const width = Math.max(header.length, ...lines.map((l) => l.length)) + 6;
  const center = (s: string) => {
    const diff = width - 2 - s.length;
    return " ".repeat(Math.floor(diff / 2)) + s + " ".repeat(Math.ceil(diff / 2));
  };
  const padRight = (s: string) => s + " ".repeat(Math.max(0, width - 2 - s.length));
  console.log("┌" + "─".repeat(width) + "┐");
  console.log("│" + center(header) + "│");
  console.log("├" + "─".repeat(width) + "┤");
  for (const l of lines) console.log("│ " + padRight(l) + " │");
  console.log("└" + "─".repeat(width) + "┘");
}

const mark = (ok: boolean) => (ok ? "✓" : "✗");