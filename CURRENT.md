# Bangpii News — Status Progres Backend

Ringkasan progres & status fitur backend API saat ini. Diperbarui: **31 Agu 2026**.

## Status Umum

| Area | Status | Catatan |
|---|---|---|
| Backend lengkap | ✅ Selesai | Node + Express + TypeScript |
| Deploy production | ✅ Live | https://bangpii-news.vercel.app |
| Frontend | ✅ Live | https://bang-pii-news.vercel.app |
| Remote git | ✅ Ter-push | github.com/bangpii/BackendNews (branch `main`) |

## Status Integrasi (per `/health`)

| Integrasi | Lokal | Produksi | Keterangan |
|---|---|---|---|
| Firebase (Firestore) | ✅ connected | ✅ connected | Data utama |
| Cloudinary | ✅ connected | ✅ connected | Media upload (kompresi `sharp` → webp) |
| SMTP | ✅ configured | ✅ configured | Email form kontak |
| Redis | ⚠️ disabled (opsional) | ⚠️ disabled | Realtime adapter + rate-limit store; dipakai bila tersedia |
| Socket.IO | ✅ aktif | ✅ | Realtime |

> Catatan: `cloudinary` & `smtp` sempat tampil `disabled` di produksi karena endpoint `/health` tidak me-refresh status pada cold start — sudah diperbaiki agar `/health` memanggil `ensureCloudinary()` + `ensureSmtp()`.

## Fitur — Matriks Status

Daftar fitur backend dan statusnya.

| Fitur | Status | Detail |
|---|---|---|
| Fetch berita eksternal | ✅ | Berita Indo API → simpan ke Firestore |
| Berita — hero/terkini/trending | ✅ | Trending berdasar views |
| Berita — kategori & pencarian | ✅ | Filter `category`, `search`, `limit` |
| Berita — sync manual | ✅ | `/api/news/sync` |
| Views per-IP + anti-spam | ✅ | Dedup per IP 30 menit |
| Komunitas — buat post (teks) | ✅ | Guest, tanpa login |
| Komunitas — upload gambar | ✅ | `multer` → `sharp` → Cloudinary (webp) |
| Like post | ✅ | Toggle per user |
| Share post | ✅ | — |
| Komentar post & artikel | ✅ | Like komentar juga |
| Reaksi | ✅ | — |
| Form kontak | ✅ | Simpan ke Firestore + kirim email via SMTP |
| Auth/Guest session | ✅ | `whoami`, identitas guest; tanpa login wajib |
| Rate-limit & anti-DoS | ✅ | Global + strict limiter, slow-down |

## Env — Status di Vercel (Produksi)

| Variabel | Status | Keterangan |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | ✅ diset | Firebase connected |
| `CLOUDINARY_CLOUD_NAME` | ✅ diset | Cloudinary connected |
| `CLOUDINARY_API_KEY` | ✅ diset | |
| `CLOUDINARY_API_SECRET` | ✅ diset | |
| `SMTP_HOST` / `SMTP_PORT` | ✅ diset | SMTP configured |
| `SMTP_SECURE` | ✅ diset | |
| `SMTP_USER` / `SMTP_PASS` | ✅ diset | |
| `CONTACT_TO` | ✅ diset | Tujuan email kontak |
| `CORS_ORIGINS` / `FE_URL` | ✅ diset | |
| `REDIS_*` | — | Opsional, belum dipakai |

> Nilai rahasia tidak dicantumkan di dokumen ini.

## Tools & Script Publik

| Fitur | Status |
|---|---|
| `npm run dev` | ✅ Server lokal (watch, port 4000) |
| `npm run test:api` | ✅ 28 pengecekan endpoint + spinner |
| `npm run report:api` | ✅ Generate PDF `docs/api-test-report.pdf` |
| `npm run build` / `start` | ✅ Build & run produksi |
| `npm run typecheck` | ✅ Type suggestion |

## Riwayat Likuidasi Teknis Penting

| Item | Status | Catatan |
|---|---|---|
| Express 5 & `string \| string[]` query | ✅ | Helper `qs()`, `qsInt()`, `param()` di `utils/query.ts` |
| `precedence` bug bump comment likes | ✅ | Diperbaiki `commentModel.ts` |
| Firebase credential path saat bundle | ✅ | `resolveCredentialPath()` multi-candidate |
| `express-mongo-sanitize` Express 5 | ✅ | Diganti sanitizer custom `sanitizeDeep()` |
| `errorHandler` crash `err.code` non-string | ✅ | Guard `typeof code === "string"` |
| Composite index Firestore | ✅ | Diganti filter di memori |
| `ignoreUndefinedProperties` Firestore | ✅ | Diganti util `stripUndefined()` |
| View dedup 30 menit | ✅ | `hasViewed()` sebelum `recordView` |

## Belum / Hal yang Bisa Dilakukan Berikutnya

- [ ] Verifikasi end-to-end nyata di produksi (upload 1 gambar via endpoint, kirim 1 pesan kontak) — konfirmasi Cloudinary & SMTP berfungsi nyata.
- [ ] (Opsional) Aktifkan Redis untuk realtime adapter + rate-limit store terdistribusi.
- [ ] (Opsional) Tambah auth/akun jika fitur login dibutuhkan.
