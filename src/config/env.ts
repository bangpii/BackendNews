import "dotenv/config";

function num(v: string | undefined, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) && v !== undefined && v !== "" ? n : def;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: num(process.env.PORT, 4000),
  host: process.env.HOST ?? "0.0.0.0",

  feUrl: process.env.FE_URL ?? "https://bang-pii-news.vercel.app/",
  corsOrigins: (process.env.CORS_ORIGINS ?? "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT ?? "",
  firebaseCredentialPath:
    process.env.FIREBASE_CREDENTIAL_PATH ?? "service-account.json",
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "",

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",

  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: num(process.env.SMTP_PORT, 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  contactTo: process.env.CONTACT_TO ?? process.env.SMTP_USER ?? "",

  redisHost: process.env.REDIS_HOST ?? "",
  redisPort: num(process.env.REDIS_PORT, 6379),
  redisPassword: process.env.REDIS_PASSWORD ?? "",

  rateLimitWindowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
  rateLimitMax: num(process.env.RATE_LIMIT_MAX, 120),
  newsSyncLimit: num(process.env.NEWS_SYNC_LIMIT, 50),

  adminApiKey: process.env.ADMIN_API_KEY ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
} as const;
