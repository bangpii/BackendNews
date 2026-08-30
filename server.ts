import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

import express from "express";
import cors from "cors";
import { Redis } from "ioredis";
import { v2 as cloudinary } from "cloudinary";
import nodemailer from "nodemailer";
import { Server as SocketServer } from "socket.io";

/* ------------------------------------------------------------------ *
 * Config
 * ------------------------------------------------------------------ */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credPath = path.resolve(
  __dirname,
  process.env.FIREBASE_CREDENTIAL_PATH ?? "service-account.json"
);

const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? "0.0.0.0";
const FE_URL = process.env.FE_URL ?? "https://bang-pii-news.vercel.app/";
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const redisEnabled = Boolean(process.env.REDIS_HOST);
const socketEnabled = process.env.SOCKETIO_ENABLED === "true";

/* ------------------------------------------------------------------ *
 * Status flags
 * ------------------------------------------------------------------ */

let redisStatus = "disabled";
let firebaseStatus = "disabled";
let cloudinaryStatus = "disabled";
let smtpStatus = "disabled";
let socketioStatus = "disabled";

const mark = (ok: boolean) => (ok ? "✓" : "✗");

/* ------------------------------------------------------------------ *
 * Redis
 * ------------------------------------------------------------------ */

async function initRedis() {
  if (!redisEnabled) return;
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    retryStrategy: (times: number) => Math.min(times * 200, 2000),
  });
  try {
    await redis.connect();
    await redis.ping();
    redisStatus = "ready";
  } catch {
    redisStatus = "offline";
  }
  return redis;
}

/* ------------------------------------------------------------------ *
 * Firebase
 * ------------------------------------------------------------------ */

async function initFirebase() {
  try {
    const { default: admin } = await import("firebase-admin");
    let serviceAccount: object;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      serviceAccount = JSON.parse(await readFile(credPath, "utf-8"));
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
    });
    await admin.firestore().listCollections();
    firebaseStatus = "connected";
  } catch {
    firebaseStatus = "error";
  }
}

/* ------------------------------------------------------------------ *
 * Cloudinary
 * ------------------------------------------------------------------ */

async function initCloudinary() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) {
    cloudinaryStatus = "disabled";
    return;
  }
  cloudinary.config({
    cloud_name: name,
    api_key: key,
    api_secret: secret,
    secure: true,
  });
  try {
    await cloudinary.api.ping();
    cloudinaryStatus = "connected";
  } catch {
    cloudinaryStatus = "error";
  }
}

/* ------------------------------------------------------------------ *
 * SMTP (nodemailer)
 * ------------------------------------------------------------------ */

async function initSmtp(): Promise<nodemailer.Transporter | null> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    smtpStatus = "disabled";
    return null;
  }
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  try {
    await transporter.verify();
    smtpStatus = "ready";
  } catch {
    smtpStatus = "error";
  }
  return transporter;
}

/* ------------------------------------------------------------------ *
 * Pretty status table
 * ------------------------------------------------------------------ */

function printTable() {
  const lines = [
    `Redis       ${mark(redisStatus === "ready")} ${redisStatus}`,
    `Firebase    ${mark(firebaseStatus === "connected")} ${firebaseStatus}`,
    `Cloudinary  ${mark(cloudinaryStatus === "connected")} ${cloudinaryStatus}`,
    `SMTP        ${mark(smtpStatus === "ready")} ${smtpStatus}`,
    `Socket.IO   ${mark(socketioStatus === "ready")} ${socketioStatus}`,
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

/* ------------------------------------------------------------------ *
 * HTTP server + Socket.IO
 * ------------------------------------------------------------------ */

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);

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
    res.json({ service: "bangpii-news-api", message: "Bangpii News API is running." });
  });

  app.use((_req, res) => {
    res.status(404).json({ ok: false, error: "Not found" });
  });

  let io: SocketServer | null = null;
  if (socketEnabled) {
    io = new SocketServer(httpServer, {
      cors: {
        origin: CORS_ORIGINS.includes("*") ? true : CORS_ORIGINS,
        credentials: true,
      },
    });
    io.on("connection", (socket) => {
      socket.on("disconnect", () => {});
    });
    socketioStatus = "ready";
  }

  await Promise.all([initRedis(), initFirebase(), initCloudinary(), initSmtp()]);

  httpServer.listen(PORT, HOST, () => {
    printTable();
    console.log("API  →  http://" + HOST + ":" + PORT);
    console.log("FE   →  " + FE_URL);
    if (io) console.log("SOCK →  Socket.IO listening on " + HOST + ":" + PORT);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal bootstrap error", err);
  process.exit(1);
});
