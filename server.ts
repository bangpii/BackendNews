import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

import express, { type Express } from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credPath = path.resolve(
  __dirname,
  process.env.FIREBASE_CREDENTIAL_PATH ?? "service-account.json"
);

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";
const FE_URL = process.env.FE_URL ?? "https://bang-pii-news.vercel.app/";
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* ------------------------------------------------------------------ *
 * Integration status
 * ------------------------------------------------------------------ */

let firebaseStatus = "disabled";
let cloudinaryStatus = "disabled";
let smtpStatus = "disabled";
let redisStatus = "disabled";
let dbRef: { firestore: unknown; auth: unknown } | null = null;

/* ------------------------------------------------------------------ *
 * Lazy init functions (idempotent, called once)
 * ------------------------------------------------------------------ */

let firebaseInitPromise: Promise<void> | null = null;
function ensureFirebase() {
  if (!firebaseInitPromise) {
    firebaseInitPromise = (async () => {
      try {
        const { default: admin } = await import("firebase-admin");
        let serviceAccount: object;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } else {
          serviceAccount = JSON.parse(await readFile(credPath, "utf-8"));
        }
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
          });
        }
        dbRef = { firestore: admin.firestore(), auth: admin.auth() };
        firebaseStatus = "connected";
      } catch {
        firebaseStatus = "error";
      }
    })();
  }
  return firebaseInitPromise;
}

function ensureCloudinary() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) {
    cloudinaryStatus = "disabled";
    return;
  }
  cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret, secure: true });
  cloudinaryStatus = "connected";
}

let smtpTransport: nodemailer.Transporter | null = null;
function ensureSmtp() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    smtpStatus = "disabled";
    return null;
  }
  smtpTransport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  smtpStatus = "configured";
  return smtpTransport;
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

  app.get("/", (_req, res) => {
    ensureCloudinary();
    ensureSmtp();
    void ensureFirebase();
    res.json({ service: "bangpii-news-api", message: "Bangpii News API is running." });
  });

  app.get("/health", (_req, res) => {
    void ensureFirebase().then(() => {
      res.json(buildStatus());
    });
  });

  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: "Not found" });
  });

  return app;
}

export { dbRef, smtpTransport };

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
    void ensureFirebase().then(() => {
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
