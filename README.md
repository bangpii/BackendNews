# Bangpii News - Backend

Backend API untuk **Bangpii News** (Node + Express + TypeScript). Berisi integrasi Redis, Firebase (Firestore), Cloudinary, SMTP (Gmail), dan Socket.IO.

## Cara Menjalankan

```bash
# development (auto-reload via tsx)
npm run dev

# build lalu start
npm run build
npm start
```

## Build & Docker

```bash
npm run build          # bundle ESM (dependency external)
docker build -t bangpii-news-backend .
docker run -p 4000:4000 -e PORT=4000 bangpii-news-backend
```

## Deploy ke Koyeb (free tier, long-running, Socket.IO + Redis jalan penuh)

Koyeb menjalankan Node.js sebagai **web service selalu aktif** (bukan serverless), sehingga Socket.IO + Redis berjalan lengkap.

1. **Push ke GitHub** — push folder `backend/` (dengan `Dockerfile`, `.dockerignore`, `.gitignore`) ke sebuah repo GitHub, misal `bangpii-news-backend`.
2. **Buat Web Service di Koyeb** (koyeb.com → Create Web Service → GitHub):
   - Pilih repo dan branch.
   - Build method: **Dockerfile**.
3. **Set Environment Variables** di dashboard Koyeb:
   - `NODE_ENV=production`
   - `PORT=8080` (port yang diekspos Koyeb)
   - `HOST=0.0.0.0`
   - `CORS_ORIGINS=http://localhost:3000,https://bang-pii-news.vercel.app/`
   - `FE_URL=https://bang-pii-news.vercel.app/`
   - `REDIS_HOST=<host redis koyeb>`, `REDIS_PORT=6379` (atau kosongkan kalau belum pakai Redis)
   - `FIREBASE_SERVICE_ACCOUNT=<isi penuh file service-account.json sebagai JSON string>`
   - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `CONTACT_TO`
   - `SOCKETIO_ENABLED=true`
4. **Deploy** → Koyeb build image & run `node dist/server.js` sebagai service aktif.

> **Catatan keamanan:** `service-account.json`, `.env`, dan `dist/` tidak disertakan ke image/container (lihat `.dockerignore` & `.gitignore`). Kredensial Firebase disuplai lewat env var `FIREBASE_SERVICE_ACCOUNT`.
>
> Redis lokal bukan bagian dari deploy — gunakan Koyeb Redis add-on atau layanan Redis eksternal, lalu isi `REDIS_HOST`/`REDIS_PORT`. Jika tidak dipakai, biarkan `REDIS_HOST` kosong.


Saat dijalankan, terminal menampilkan tabel status integrasi:

```
┌─────────────────────────────┐
│       Backend ready       │
├─────────────────────────────┤
│ Redis       ✓ ready         │
│ Firebase    ✓ connected     │
│ Cloudinary  ✓ connected     │
│ SMTP        ✓ ready         │
│ Socket.IO   ✓ ready         │
└─────────────────────────────┘
API  →  http://0.0.0.0:4000
FE   →  https://bang-pii-news.vercel.app/
```

## Konfigurasi (.env)

Salin `.env.example` menjadi `.env`, lalu isi sesuai kebutuhan:

| Variabel | Deskripsi |
|----------|-----------|
| `NODE_ENV` | Environment (`development` / `production`) |
| `PORT` | Port API (default 4000) |
| `HOST` | Host bind (default 0.0.0.0) |
| `CORS_ORIGINS` | Origin yang diizinkan, dipisah koma |
| `FE_URL` | URL frontend (ditampilkan di terminal) |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis (opsional, kosongkan untuk disable) |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CREDENTIAL_PATH` | Firebase Admin (service account JSON) |
| `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET` | Cloudinary |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `CONTACT_TO` | Email via SMTP |
| `SOCKETIO_ENABLED` | Aktifkan Socket.IO (`true` / `false`) |

## Realtime

- **Firebase Firestore** adalah sumber data utama (online) dengan listener realtime bawaan.
- **Socket.IO** dipakai untuk broadcast instan antar client (notifikasi, event live), bisa dipadukan dengan Firestore.

## Library Compression

- `sharp` — kompresi/optimasi gambar
- `compression` — kompresi respons HTTP (gzip/brotli)

## API News (gratis, update tiap hari, berita Indonesia)

| API | Butuh Key? | Kuota | Catatan |
|-----|-----------|-------|---------|
| **Berita Indo API** (satyawikananda) | ❌ Tidak | Unlimited | ⭐ Terbaik untuk project ini. Ambil berita dari banyak portal Indonesia (Antara, CNN, CNBC, Republika, Tempo, Okezone, Kumparan, Tribun, Suara, dll). Bahasa Indonesia, gratis, tanpa key. |
| **API Berita Indonesia** (renomureza) | ❌ Tidak | Unlimited | Alternatif, dari RSS portal berita Indonesia |
| **GNews API** | ✅ Ya (gratis) | 100 req/day | Mendukung `lang=id` dan `country=id`, tapi perlu daftar |
| **CNN Indonesia API** | ❌ Tidak | Unlimited | Khusus CNN |

Referensi lebih lengkap: [DAFTAR-API-LOKAL-INDONESIA](https://github.com/farizdotid/DAFTAR-API-LOKAL-INDONESIA)
