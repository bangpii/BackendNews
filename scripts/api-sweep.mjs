/**
 * API Sweep — tes semua endpoint backend Bangpii News.
 *
 * Cara pakai:
 *   1. Jalankan server backend (local):  npm run dev        → http://localhost:4000
 *   2. Jalankan tes:                      npm run test:api
 *
 *   Ganti target:  API_URL=https://bangpii-news.vercel.app npm run test:api
 *
 * Hasil: mengetes setiap endpoint (dengan spinner animasi loading),
 * lalu membuat file  docs/api-test-report.pdf  berisi tabel
 * alamat endpoint + kode status + contoh respons.
 */
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Target server (override via env API_URL)
const BASE = (process.env.API_URL || "http://localhost:4000").replace(/\/$/, "");

/* ------------------------------------------------------------------ *
 * Definisi endpoint yang dites
 * ------------------------------------------------------------------ */
const EP = (method, path, name, body) => ({ method, path, name, body });

const TESTS = [
  EP("GET", "/", "Root / kesehatan"),
  EP("GET", "/health", "Status integrasi (Firebase, Cloudinary, SMTP)"),

  EP("GET", "/api/news?limit=2", "Daftar berita (terbaru, limit 2)"),
  EP("GET", "/api/news/hero", "Berita hero (3 terbaru)"),
  EP("GET", "/api/news/terkini?limit=3", "Berita terkini hari ini (limit 3)"),
  EP("GET", "/api/news/trending?limit=3", "Berita trending (urut views)"),
  EP("GET", "/api/news?category=teknologi&limit=2", "Berita per kategori (teknologi)"),
  EP("GET", "/api/news?search=indonesia&limit=2", "Cari berita (q=indonesia)"),
  EP("GET", "/api/news/sync", "Sinkronisasi berita dari API eksternal"),
  EP("GET", "/api/categories", "Daftar kategori"),
  EP("GET", "/api/categories/teknologi?limit=2", "Berita kategori tertentu"),
  EP("GET", "/api/news/:id", "Detail berita by ID (diisi otomatis)"),

  EP("GET", "/api/posts?limit=3", "Daftar postingan komunitas"),
  EP("POST", "/api/posts", "Buat postingan baru", { content: "Posting dari API sweep", tags: ["tes"] }),
  EP("POST", "/api/posts/:id/like", "Like postingan"),
  EP("POST", "/api/posts/:id/share", "Bagikan postingan"),

  EP("GET", "/api/posts/:id/comments", "Komentar pada postingan"),
  EP("POST", "/api/posts/:id/comments", "Tambah komentar pada postingan", { body: "Komentar dari API sweep" }),

  EP("GET", "/api/comments/article/:id", "Komentar pada artikel"),
  EP("POST", "/api/comments/article/:id", "Tambah komentar pada artikel", { body: "Komentar artikel dari sweep" }),
  EP("GET", "/api/comments/article/:id/count", "Jumlah komentar artikel"),

  EP("POST", "/api/views/:id", "Catat view (anti-spam 30 menit)"),
  EP("GET", "/api/views/:id", "Baca jumlah view"),

  EP("POST", "/api/reactions/article/:id", "Pasang reaksi (senyum)", { value: "senyum" }),
  EP("POST", "/api/reactions/article/:id", "Toggle reaksi (sama → hapus)", { value: "senyum" }),
  EP("GET", "/api/reactions/article/:id", "Baca reaksi"),

  EP("POST", "/api/contact", "Kirim pesan kontak (SMTP + simpan)", {
    name: "Budi",
    email: "budi@example.com",
    subject: "Tes Kontak (API sweep)",
    message: "Pesan pengujian dari API sweep.",
  }),

  EP("GET", "/api/auth/whoami", "Identitas tamu anonim"),
];

/* ------------------------------------------------------------------ *
 * Util kecil
 * ------------------------------------------------------------------ */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetcher(url, { method = "GET", body } = {}) {
  const isSync = url.includes("/news/sync");
  const timeoutMs = isSync ? 90000 : 20000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const init = { method, headers: { Accept: "application/json" }, signal: ctrl.signal };
  if (process.env.API_KEY) {
    init.headers["x-api-key"] = process.env.API_KEY;
  }
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, init);
  } finally {
    clearTimeout(timer);
  }
  let json = null;
  const txt = await res.text();
  try {
    json = JSON.parse(txt);
  } catch {
    json = { raw: txt.slice(0, 200) };
  }
  return { status: res.status, json };
}

/* ------------------------------------------------------------------ *
 * Spinner animasi loading
 * ------------------------------------------------------------------ */
const SPIN = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
function startSpinner(msg) {
  let i = 0;
  const iv = setInterval(() => {
    process.stdout.write(`\r\x1b[36m${SPIN[i++ % SPIN.length]}\x1b[0m ${msg}`);
  }, 80);
  return () => {
    clearInterval(iv);
    process.stdout.write("\r\x1b[2K");
  };
}

/** Cuplikan JSON untuk PDF (dipotong agar ringkas). */
function snippet(obj, max = 320) {
  let s;
  try {
    s = JSON.stringify(obj);
  } catch {
    s = String(obj);
  }
  if (s.length > max) s = s.slice(0, max) + "…";
  return s;
}

/* ------------------------------------------------------------------ *
 * Ambil ID nyata untuk endpoint :id
 * ------------------------------------------------------------------ */
async function primeIds() {
  const ids = {};
  try {
    const n = await fetcher(`${BASE}/api/news?limit=1`);
    ids.news = n.json?.data?.[0]?.id || "news-id-placeholder";
  } catch {
    ids.news = "news-id-placeholder";
  }
  try {
    const p = await fetcher(`${BASE}/api/posts?limit=1`);
    ids.post = p.json?.data?.[0]?.id || "post-id-placeholder";
  } catch {
    ids.post = "post-id-placeholder";
  }
  return ids;
}

function fillPath(path, ids) {
  // Path mulai /api/posts → pakai ID postingan; selain itu (news, comments/article,
  // views, reactions) → pakai ID berita.
  const id = path.startsWith("/api/posts") ? ids.post : ids.news;
  return path.replace(":id", id).replace(":type", "article");
}

/* ------------------------------------------------------------------ *
 * Render PDF (tabel alamat endpoint + status + respons)
 * ------------------------------------------------------------------ */
function renderPdf(results) {
  return new Promise((resolveRender) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30,
      info: { Title: "API Testing Report — Bangpii News", Author: "API Sweep" },
      bufferPages: true,
    });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolveRender(Buffer.concat(chunks)));

    const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Header
    doc.fillColor("#0b3d62").fontSize(18).text("API Testing Report — Bangpii News Backend", { align: "center" });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor("#555").text(`Target: ${BASE}`, { align: "center" });
    doc.text(`Dibuat: ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`, { align: "center" });
    doc.moveDown(0.6);

    // Ringkasan
    const ok = results.filter((r) => r.status >= 200 && r.status < 300).length;
    doc.fontSize(11).fillColor("#0b3d62").text(
      `Total endpoint dites: ${results.length}  •  Sukses: ${ok}  •  Gagal: ${results.length - ok}`
    );
    doc.moveDown(0.7);

    // Tabel
    const colW = {
      no: 24,
      status: 42,
      method: 44,
      endpoint: pageW * 0.33,
      response: pageW - 24 - 42 - 44 - pageW * 0.33,
    };
    const rowH = 20;
    const startY = doc.y;

    const drawRow = (cells, { header = false } = {}) => {
      const x0 = doc.page.margins.left;
      const colXs = [
        x0,
        x0 + colW.no,
        x0 + colW.no + colW.status,
        x0 + colW.no + colW.status + colW.method,
        x0 + colW.no + colW.status + colW.method + colW.endpoint,
      ];
      const widths = [colW.no, colW.status, colW.method, colW.endpoint, colW.response];

      // hitung tinggi baris berdasarkan isi respons
      const respText = cells[4] || "";
      const lineH = 10;
      const lines = Math.max(1, Math.ceil(doc.fontSize(7).widthOfString(respText) / widths[4]));
      const h = Math.max(rowH, 12 + lines * lineH);

      if (doc.y + h > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }

      const y = doc.y;
      // bg header
      if (header) {
        doc.rect(x0, y, pageW, h).fill("#e8f4fb");
      }

      resZ: for (let i = 0; i < cells.length; i++) {
        const w = widths[i];
        const x = colXs[i];
        // border
        doc.rect(x, y, w, h).strokeColor("#c9d6e2").lineWidth(0.5).stroke();
        const color = getCellColor(cells, i);
        doc.fillColor(color).fontSize(i === 4 ? 6.5 : 7);
        doc.text(cells[i] || "", x + 3, y + (h - 12) / 2, {
          width: w - 6,
          height: h - 4,
          ellipsis: true,
          lineBreak: i === 4,
        });
      }
      doc.y = y + h;
    };

    const getCellColor = (cells, i) => {
      if (i === 1) {
        const s = parseInt(cells[1], 10);
        if (s >= 200 && s < 300) return "#1f8f3d";
        if (s >= 400 && s < 500) return "#d9822b";
        return "#c0392b";
      }
      if (i === 2) return "#333";
      return "#222";
    };

    // Header kolom
    drawRow(["#", "Status", "Method", "Endpoint", "Contoh Respons (JSON)"], { header: true });

    results.forEach((r, idx) => {
      drawRow([
        String(idx + 1),
        String(r.status),
        r.method,
        r.displayPath,
        r.example,
      ]);
    });

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.fillColor("#999").fontSize(8).text(
        `Bangpii News API — halaman ${i + 1} dari ${pages.count}`,
        doc.page.margins.left,
        doc.page.height - 25,
        { width: pageW, align: "center" }
      );
    }

    doc.end();
  });
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */
async function main() {
  console.log(`\x1b[1mAPI Sweep — Bangpii News\x1b[0m`);
  console.log(`Target: \x1b[34m${BASE}\x1b[0m\n`);

  const ids = await primeIds();
  const stop = startSpinner("Menyiapkan pengujian…");
  await sleep(500);
  stop();

  const results = [];

  for (let i = 0; i < TESTS.length; i++) {
    const t = TESTS[i];
    const path = fillPath(t.path, ids);
    const url = `${BASE}${path}`;
    const stop2 = startSpinner(`[${i + 1}/${TESTS.length}] ${t.method} ${path}`);
    let status = 0;
    let json = null;
    let err = null;
    try {
      const r = await fetcher(url, { method: t.method, body: t.body });
      status = r.status;
      json = r.json;
    } catch (e) {
      err = e.message;
      status = 0;
    }
    stop2();
    const okResult = status >= 200 && status < 300;
    const color = okResult ? "32" : "31";
    console.log(`\x1b[${color}${okResult ? "✓" : "✗"}\x1b[0m ${t.method.padEnd(4, " ")} ${status}  ${path}  ${err ? `(${err})` : ""}`);
    results.push({
      method: t.method,
      path,
      displayPath: t.path, // tampilkan template asli di PDF
      status,
      name: t.name,
      example: err ? `ERROR: ${err}` : snippet(json),
    });
    await sleep(120);
  }

  // Simpan PDF
  const stop3 = startSpinner("Men-generate PDF laporan…");
  const pdf = await renderPdf(results);
  stop3();
  const outPath = resolve(__dirname, "..", "docs", "api-test-report.pdf");
  await writeFile(outPath, pdf);

  const okCount = results.filter((r) => r.status >= 200 && r.status < 300).length;
  console.log(`\n\x1b[32m✓ Selesai.\x1b[0m Sukses ${okCount}/${results.length} endpoint.`);
  console.log(`📄 Laporan PDF: \x1b[1m${outPath}\x1b[0m`);
  if (okCount < results.length) {
    console.log(`\x1b[33m⚠ Beberapa endpoint gagal — cek baris bertanda ✗ di atas.\x1b[0m`);
  }
}

main().catch((e) => {
  console.error("\n\x1b[31mGagal menjalankan API sweep:\x1b[0m", e.message);
  process.exit(1);
});
