# Bangpii News — Backend API

Backend REST API + realtime untuk aplikasi **Bangpii News** (Node.js + Express + TypeScript). Menyediakan berita (fetch eksternal), komunitas (post, like, komentar, reaksi, view), dan kontak — semuanya **guest/anonymous tanpa login**.

> **Dokumentasi lain:** lihat `CURRENT.md` untuk ringkasan progres & status fitur saat ini.

## Fitur Utama

- **Berita**: fetch dari API eksternal (Berita Indo) → simpan ke Firestore; endpoint hero, terkini, trending, kategori, pencarian, detail, sync manual.
- **Komunitas**: post teks/gambar (kompresi `sharp` → webp → Cloudinary), like, komentar, reaksi, share, view per-IP.
- **Kontak**: form kontak → simpan ke Firestore + kirim email via SMTP (nodemailer).
- **Keamanan**: helmet, CORS, rate-limit global & ketat, slow-down, sanitasi body, anti-DoS view, **proteksi API-key pada endpoint admin/sensitif** (`/api/news/sync`).
- **Realtime**: Socket.IO (dengan Redis adapter bila Redis tersedia).
- **Cron (auto-sync)**: Vercel Cron Jobs menjalankan `/api/news/sync` otomatis setiap 6 jam (lihat `vercel.json`).

## Teknologi / yang Diinstal

| Kategori | Paket |
|---|---|
| Runtime | Node.js ≥ 20, TypeScript |
| Framework | Express 5 |
| Data | firebase-admin (Firestore) |
| Media | cloudinary, multer, sharp |
| Email | nodemailer |
| Realtime | socket.io, @socket.io/redis-adapter, ioredis, rate-limit-redis |
| Keamanan | helmet, cors, express-rate-limit, express-slow-down, hpp |
| Validasi | zod |
| Logging | pino, pino-http, morgan |
| Lain | dotenv, compression, pdfkit (laporan), esbuild/tsx (dev), vitest + supertest (test) |

## Persyaratan

- **Node.js ≥ 20**
- **Firestore** (Firebase Admin) — wajib untuk semua data.
- **Cloudinary** — opsional, wajib untuk upload gambar post.
- **SMTP** — opsional, untuk kirim email dari form kontak.
- **Redis** — opsional, untuk realtime + rate-limit store.

## Instalasi

```bash
npm install
```

## Konfigurasi

Salin template env lalu isi sesuai kebutuhan:

```bash
cp .env.example .env
```

Variabel penting (nilai rahasia diisi sendiri, tidak dicantumkan di sini):

| Variabel | Keterangan |
|---|---|
| `PORT`, `HOST`, `NODE_ENV` | Konfigurasi server |
| `CORS_ORIGINS` | Origin yang diizinkan (pisahkan koma) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON service account Firebase (atau `FIREBASE_CREDENTIAL_PATH` ke file) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Kredensial Cloudinary (untuk upload gambar) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | Kredensial SMTP email |
| `CONTACT_TO` | Alamat email tujuan form kontak |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis (opsional) |
| `RATE_LIMIT_*` | Penyetelan rate-limit |
| `ADMIN_API_KEY` | Kunci untuk endpoint admin/sensitif (kirim header `x-api-key`) |
| `CRON_SECRET` | Kunci untuk Vercel Cron Jobs (kirim `Authorization: Bearer <secret>`) |

> ⚠️ Jangan pernah commit file `.env` atau `service-account.json` ke git. Keduanya sudah berada di `.gitignore` / `.vercelignore`.

## Menjalankan Server

**Development (watch, reload otomatis):**

```bash
npm run dev
```

Server berjalan di `http://localhost:4000` (default `PORT`).

**Menjalankan di terminal lain → tes API:**

```bash
npm run test:api
```

Menjalankan 28 pengecekan endpoint terhadap `http://localhost:4000` dengan spinner loading dan menghasilkan laporan PDF `docs/api-test-report.pdf`.

Target produksi (opsional):

```bash
API_URL=https://bangpii-news.vercel.app npm run test:api
```

**Build & menjalankan produksi:**

```bash
npm run build
npm start
```

**Script lainnya:**

```bash
npm run typecheck   # cek tipe TypeScript
npm test            # unit test (vitest)
npm run report:api  # sama dengan test:api (generate PDF)
```

## Struktur Proyek

```
server.ts               # entrypoint (Express app + inisialisasi)
src/
  app.ts                # setup middleware & router
  config/               # firebase, cloudinary, env, redis, smtp
  controllers/          # logika tiap resource
  middleware/           # error, guest, rate-limit, sanitize
  models/               # akses Firestore (news, post, comment, dll)
  routes/               # definisi endpoint (prefix /api)
  services/             # business logic (fetch berita, email, dll)
  utils/                # helper (query, stripUndefined, dll)
  validations/          # schema zod
scripts/
  api-sweep.mjs         # tes API + generate PDF
docs/
  api-test-report.pdf   # laporan tes yang dihasilkan
vercel.json             # konfigurasi deploy Vercel
```

## Endpoint API

Semua endpoint di-prefix `/api`. Contoh lengkap + respons: lihat `docs/api-test-report.pdf`.

### Berita
| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/news` | Daftar berita (filter: `limit`, `category`, `search`) |
| GET | `/api/news/hero` | Berita unggulan |
| GET | `/api/news/terkini` | Berita terbaru |
| GET | `/api/news/trending` | Berita trending (berdasar views) |
| GET | `/api/news/sync` | Fetch/sinkronisasi berita dari sumber eksternal |
| GET | `/api/news/:id` | Detail berita |
| GET | `/api/categories` | Daftar kategori |
| GET | `/api/categories/:slug` | Berita per kategori |

### Komunitas (Post)
| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/posts` | Daftar post komunitas |
| POST | `/api/posts` | Buat post (multipart: foto opsional) |
| GET | `/api/posts/:id/comments` | Komentar sebuah post |
| POST | `/api/posts/:id/comments` | Tambah komentar |
| POST | `/api/posts/:id/like` | Like/unlike post |
| POST | `/api/posts/:id/share` | Share post |

### Komentar (artikel berita)
| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/comments/article/:id` | Komentar artikel |
| GET | `/api/comments/article/:id/count` | Jumlah komentar artikel |
| POST | `/api/comments/article/:id` | Tambah komentar artikel |
| POST | `/api/comments/:id/like` | Like/unlike komentar |

### Reaksi & View
| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/reactions/:type/:id` | Beri reaksi (mis. `:type` = `post`) |
| GET | `/api/reactions/:type/:id` | Lihat reaksi |
| POST | `/api/views/:id` | Catat view (dedup per-IP 30 menit) |
| GET | `/api/views/:id` | Jumlah view |

### Pengguna & Auth (guest/dummy)
| Method | Path | Keterangan |
|---|---|---|
| GET | `/api/users/me` | Identitas guest saat ini |
| PUT | `/api/users/me` | Perbarui identitas |
| GET | `/api/auth/whoami` | Info guest/client |

### Kontak
| Method | Path | Keterangan |
|---|---|---|
| POST | `/api/contact` | Kirim pesan kontak (simpan + email) |

### Sistem
| Method | Path | Keterangan |
|---|---|---|
| GET | `/health` | Status integrasi (firebase, redis, cloudinary, smtp) |

## Deploy ke Vercel

```bash
vercel login
vercel --prod --yes
```

Sebelum deploy, set env berikut di dashboard Vercel (Production) — nilai rahasia diset manual, tidak di-commit:

`FIREBASE_SERVICE_ACCOUNT`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO`, `CORS_ORIGINS`, `FE_URL`, `ADMIN_API_KEY`, `CRON_SECRET`.

Setelah deploy, verifikasi status integrasi di:

```
GET https://<deployment-url>/health
```

> **Endpoint admin yang diproteksi** (`/api/news/sync`) memerlukan header `x-api-key: <ADMIN_API_KEY>` atau `Authorization: Bearer <CRON_SECRET>`. Untuk mengetesnya:
> ```bash
> API_KEY=<ADMIN_API_KEY> npm run test:api
> ```

## Verifikasi

```bash
npm run typecheck   # cek tipe
npm run test:api    # tes endpoint + laporan PDF
```

## Lisensi

MIT
