# Spec: Root API Profesional + Health Check (Uptime)

## Objective

Meningkatkan kualitas dan profesionalisme API Happy Bouquet pada layer publik paling dasar:

1. **`GET /`** — dari sekadar `{ message: 'Welcome...' }` menjadi **root API informasi** yang profesional: nama API, versi, status, uptime, environment, daftar ringkas resource utama, dan timestamp — tetap memakai format respons global `{ status, message, data, error }` dan **tidak membocorkan informasi sensitif** (kredensial, IP internal, path absolut).
2. **`GET /health`** — endpoint health check ringan (uptime + runtime dasar) yang **kompatibel dengan layanan monitoring gratis & populer** (UptimeRobot, Healthchecks.io, Uptime Kuma, Better Stack, dsb.): merespons HTTP 200 + status `ok` saat server sehat, cepat, tanpa dependensi tambahan (pakai modul bawaan Node `os`/`process`).

User: operator/DevOps yang menaruh API di bawah monitoring uptime eksternal, dan frontend/klien API yang butuh info dasar API. Success = `/` profesional + `/health` kompatibel monitoring, semua hijau, tanpa dependency baru.

## Keputusan yang Sudah Disepakati User

| Area | Keputusan |
|---|---|
| Cakupan pengecekan `/health` | **Uptime + runtime dasar saja** (status, uptime detik, versi Node, platform, env, timestamp) — gratis & cepat |
| Jalur health check | **`GET /health` terpisah + `GET /` sebagai root API info** — kompatibel UptimeRobot/Healthchecks.io/Uptime Kuma |
| Besaran siklus | **Sedang**: hanya `GET /` + `GET /health` (tanpa `/healthz`, `/ready`, atau detail admin) |

## Tech Stack

Express 4 + TypeScript, modul bawaan Node (`os`, `process`), format respons `src/utils/response.ts`. **Tidak menambah dependency** (health check memakai built-in Node — gratis, stabil, banyak dipakai).

## Commands

```bash
npm run build   # tsc → dist (typecheck)
npm test        # Jest + Supertest (WAJIB --runInBand; butuh MySQL lokal + DB happybouquet_test)
npx jest tests/health.test.ts --runInBand
```

## Project Structure

- `src/routes/healthRoutes.ts` — router kecil `GET /` dan `GET /health`.
- `src/controllers/healthController.ts` — handler: `getApiRoot` & `getHealth`.
- `src/app.ts` — daftarkan `app.use(healthRoutes)` SEBELUM route lain (paling depan), hapus handler `app.get('/')` lama.

## Code Style

```ts
// healthController.ts — ikuti pola controller lain, pakai helper respons global
import { Request, Response } from 'express';
import os from 'os';
import { successResponse } from '../utils/response';

export const getHealth = (_req: Request, res: Response) => {
  return successResponse(res, 'Server sehat', {
    status: 'ok',
    uptime: process.uptime(),
    // ...
  });
};
```

Aturan:
- Semua pesan respons Bahasa Indonesia.
- WAJIB `successResponse`/`errorResponse`, bukan `res.json` langsung.
- Respons health memakai satuan uptime dalam **detik** (`process.uptime()`), bukan string "Xd Xh Xm" — lebih mudah dikonsumsi UptimeRobot/alerts (batas waktu).
- TIDAK ada log/kredensial/secret di respons; tidak ada `req.ip` internal, tidak ada path absolut `__dirname`.
- Tidak menambah dependency apa pun.

## Testing Strategy

- Jest + Supertest. Buat `tests/health.test.ts`:
  - `GET /` → 200, `status: true`, `data` memuat `name`, `version`, `status`, `uptime`, `env`, `timestamp`, `endpoints`.
  - `GET /` → TIDAK membocorkan info sensitif (pastikan data tidak memuat kata kunci secret/password/db).
  - `GET /health` → 200, `data.status === 'ok'`, punya `uptime` (angka ≥ 0), `nodeVersion`, `platform`, `env`, `timestamp`.
  - `GET /health` → `Cache-Control: no-store` (agar monitoring tidak dapat respons basi).
- Test health TIDAK perlu MySQL (tanpa `db.sequelize.sync`) — hanya `request(app)`.
- Verifikasi akhir: `npm run build` + `npm test` hijau (seluruh suite).

## Boundaries

- **Always do**: verifikasi build + full test, format respons global, health tanpa dependency baru, `Cache-Control: no-store` di `/health`, tidak expose info sensitif di `/`, catat changelog, commit per step.
- **Ask first**: menambah dependency (tidak ada di siklus ini), perubahan rate-limit/CORS global, menambah endpoint health lain (`/healthz`, `/ready`), dan pengecekan DB/Redis di health.
- **Never do**: commit secret, log kredensial, `res.json` langsung tanpa helper, expose kredensial DB/env di respons publik, mengubah perilaku route `/api/*` yang sudah ada.

## Asumsi

1. `process.uptime()` sudah cukup merepresentasikan uptime proses server (bukan uptime OS/host).
2. Version API diambil dari `package.json` saat runtime (nilai `version` dibaca tanpa perubahan).
3. Monitoring eksternal cukup dengan HTTP 200/OK — tidak perlu payload tertentu untuk sebagian besar layanan gratis (UptimeRobot, Uptime Kuma, Healthchecks.io menerima 200).
4. Test health berjalan tanpa koneksi DB (cepat, independen dari suite lain).

## Success Criteria

- [ ] `GET /` mengembalikan `{ status: true, message, data: { name, version, status, uptime, env, endpoints, timestamp }, error: null }` HTTP 200.
- [ ] `GET /health` mengembalikan `{ status: true, data: { status: 'ok', uptime, nodeVersion, platform, arch, memory, env, timestamp } }` HTTP 200 dengan `Cache-Control: no-store`.
- [ ] Tidak ada dependency baru di `package.json`.
- [ ] `npm run build` sukses (typecheck bersih).
- [ ] `npm test` hijau (suite lama tetap hijau + `health.test.ts` baru hijau).
- [ ] Changelog `changelog.txt` + `.dev/log/changelog.txt` diperbarui; commit per step.

## Open Questions

- (TELAH DIPUTUSKAN) `endpoints` di `/` = daftar ringkas path mount: `['/api/auth', '/api/products', ...]`.
