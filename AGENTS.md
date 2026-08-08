# AGENTS.md

API backend Happy Bouquet: Express + TypeScript + Sequelize (MySQL). Repo ini backend saja (bukan monorepo). Frontend (Vue 3) dan storefront (Nuxt) ada di repo terpisah.

## Bahasa & Commit
- Selalu jawab dalam Bahasa Indonesia.
- Commit message Bahasa Indonesia, gaya conventional commit + emoji, contoh: `✨ feat(orders): ...`, `🐛 fix(migrations): ...`, `🔐 chore(security): ...`, `🚀 refactor(ci): ...` (contoh di `git log`).

## Perintah
- `npm run dev` — dev server via nodemon (`src/server.ts`)
- `npm run build` — `tsc` ke `dist/` (sekaligus typecheck)
- `npm run start` — `node dist/server.js`
- `npm test` — Jest + Supertest, WAJIB `--runInBand` (worker paralel bentrok koneksi MySQL). Test satuan: `npx jest tests/<file>.test.ts --runInBand`
- Test butuh MySQL lokal hidup (DB `happybouquet_test`) dan benar-benar mengakses DB.
- Sequelize CLI: `npx sequelize-cli db:migrate` / `db:migrate:undo` / `db:seed:all` / `db:seed:undo:all`. Konfigurasi lewat `.sequelizerc` → `sequelize.config.js` (`ts-node/register` + `src/config/config.ts`). Migrasi & seeder ditulis CommonJS `.js`.
- Tidak ada lint script — verifikasi = `npm run build` + `npm test`.

## Arsitektur
- Layering: `src/routes` → `src/controllers` → `src/services` → `src/models`. Validasi input Zod di `src/validators`.
- Model: pola factory `export const initX = (sequelize) => sequelize.define(...)` (contoh `src/models/User.ts`). Model BARU wajib didaftarkan di `src/models/index.ts`: import → init → asosiasi → tambah ke objek `db` yang di-export. SEMUA asosiasi dideklarasikan di `index.ts`, bukan di file model.
- `src/config/config.ts` WAJIB pakai `export =` (CommonJS). `export default` bikin Sequelize CLI error "Dialect needs to be explicitly supplied".
- Format respons global `{ status, message, data, error }` lewat `successResponse`/`errorResponse` di `src/utils/response.ts`. Pakai helper ini, bukan `res.json` langsung.
- Auth: `authenticateToken` (401 untuk token invalid/kedaluwarsa/`Bearer null`), `authorizeRoles(...)`, `requireActiveReseller` di `src/middlewares/authMiddleware.ts`. Kode error terpusat di `src/constants/errors.ts`.
- Upload: factory `createUploader(folder, prefix)` di `src/middlewares/uploadMiddleware.ts`; file tersimpan di `public/uploads/<folder>/`, kembalikan URL absolut `/public/uploads/...`.
- Rute baru didaftarkan di `src/app.ts` (helmet, CORS dinamis, rate-limit global ada di situ). Rate limit endpoint publik wajib aktif di production.
- Realtime analytics: Redis + Socket.io + node-cron (`src/workers/analyticsWorker.ts`), Socket di `src/socket.ts`.

## Lingkungan
- Salin `.env.example` → `.env` sebelum menjalankan apa pun. `ENCRYPTION_KEY` harus tepat 32 karakter; `CORS_ORIGINS` (comma-separated, opsional) hanya dipakai di production.

## Deployment
- CI `.github/workflows/deploy.yml` jalan hanya saat tag `v*` di-push: build → prune devDeps → FTP tanpa `node_modules`.
- Production memakai `.sequelizerc.prod` yang menunjuk ke `dist/`. Migrasi otomatis saat startup di `server.ts` DIKOMENTARI — jalankan migrasi manual.
- `.cpanel.yml`: `npm install` + `touch tmp/restart.txt` di server.

## Alur Kerja (WAJIB — ditetapkan user)
1. Fitur baru: kerjakan `/spec` (spec-driven development) TERLEBIH DAHULU sebelum menulis kode, agar terarah dan profesional.
2. Commit setiap perubahan/step selesai, jangan menumpuk banyak pekerjaan dalam satu commit.
3. Log perubahan: tambahkan entri bernomor ke `changelog.txt` (root, ter-track) di blok `LATEST UPDATES - <tanggal>` beserta timestamp. Dependency baru wajib dicatat di changelog.
4. Alur/keputusan: update `.dev/known-issues.md` dan `.dev/log/changelog.txt` (ter-track). Catatan: `.dev/context.md`, `.dev/decisions.md`, `.dev/roadmap/` TIDAK ter-track (`.dev` di `.gitignore`) — referensi lokal saja.

## Graphify
- Saat ditanya soal kodebase, cek dulu `graphify-out/graph.json` (pakai skill graphify) sebelum menjawab.
- Setelah task selesai, jalankan `graphify --update`. Jika `graphify-out/` belum ada, jalankan `graphify .` sekali penuh dulu.

## Referensi
- `client_api.http` — koleksi uji REST API.
- `docs/api_routes_kb.md` & `docs/kb_routes_produk.md` — knowledge base rute untuk integrasi frontend.
