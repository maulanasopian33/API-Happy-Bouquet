# Spec: Audit & Production-Ready Panel Happy Bouquet

## Objective

Menyelaraskan Admin Panel (Vue 3, repo `PanelHappyBouquet`) dengan API backend (Express+TS, repo `api-happyBouquet`) dan menjadikan keduanya **aman untuk production**. Siklus ini mencakup:

1. Tutup seluruh mismatch route frontend ↔ backend (endpoint yang dipanggil panel tapi tidak ada di API, dan sebaliknya).
2. Tutup gap otorisasi backend (route admin yang hanya `authenticateToken` tanpa role check).
3. Seragamkan format respons global.
4. Migrasi auth panel dari Bearer-token-di-localStorage ke **httpOnly cookie (dual-mode: cookie + Bearer)** dengan proteksi CSRF.
5. Implementasikan modul backend yang belum ada di panel: **Reseller admin, Invoice, Notification, Logs**.
6. Bersihkan mock/placeholder, hardcoded URL, dan masalah keamanan panel.

User: Admin/super_admin/staff panel. Success = panel & API match, tanpa gap otorisasi, semua lintas-repo hijau, deployable ke production.

## Keputusan yang Sudah Disepakati User

| Area | Keputusan |
|---|---|
| `POST /customers` (panel panggil, API tidak punya) | Tambah endpoint di backend |
| Scope perbaikan | Semua: mismatch + keamanan |
| Gap otorisasi backend | Tambahkan `authorizeRoles('admin','super_admin')` pada route admin yang kurang |
| Strategi token | Pindah ke httpOnly cookie, **dual-mode** (cookie untuk panel, Bearer tetap didukung untuk storefront Nuxt & API client) |
| CSRF | Cookie `SameSite=Lax` + CORS origin terbatas + cek header khusus (`X-Requested-With`) pada semua method mutasi |
| Format respons | Seragamkan ke `{ status, message, data, error }` (termasuk middleware auth & error handler) |
| Modul baru di panel | Implementasikan semua: Reseller admin, Invoice, Notification, Logs |

## Tech Stack

- **API**: Express 4, TypeScript, Sequelize 6 (MySQL), JWT (jsonwebtoken), Zod 4, helmet, cors, express-rate-limit, multer, socket.io, winston.
- **Panel**: Vue 3.5 (Composition API `<script setup>`), TypeScript, Vite 7, Tailwind v4, Pinia 3, Vue Router 4, axios, ApexCharts/Chart.js, socket.io-client.

## Commands

```bash
# API (C:\Users\Thinkpad-ant\Documents\aplikasi\happybouquet\api\api-happyBouquet)
npm run build        # tsc → dist (typecheck)
npm test             # Jest + Supertest (WAJIB --runInBand; butuh MySQL lokal + DB happybouquet_test)
npx jest tests/<file>.test.ts --runInBand   # test satuan

# Panel (C:\Users\Thinkpad-ant\Documents\aplikasi\happybouquet\PanelHappyBouquet)
npm run build        # vue-tsc -b && vite build (typecheck + bundle)
npm test             # vitest run
npm run dev          # dev server + proxy → http://127.0.0.1:5000
```

## Project Structure

- API layering: `src/routes` → `src/controllers` → `src/services` → `src/models`. Validasi Zod di `src/validators`. Middleware auth di `src/middlewares/authMiddleware.ts`. Format respons di `src/utils/response.ts`. Kode error di `src/constants/errors.ts`.
- Panel: `src/router/` (routes + guards), `src/stores/` (Pinia), `src/services/` (API clients), `src/composables/`, `src/views/`, `src/components/`, `src/types/`, `tests/`.

## Code Style (konvensi yang dipakai)

```ts
// API — respons global helper (WAJIB, bukan res.json langsung)
return successResponse(res, 'Pesan berhasil', data, 200);
return errorResponse(res, 'Pesan error', null, 400);

// API — auth route dengan role check (WAJIB untuk operasi admin)
router.post('/', authenticateToken, authorizeRoles('admin', 'super_admin'), controller.create);

// Panel — axios dengan withCredentials (cookie), tanpa token di localStorage
apiClient.post('/auth/login', credentials, { withCredentials: true });
```

Aturan:
- Semua pesan respons Bahasa Indonesia.
- Semua operasi tulis admin di API memakai `authorizeRoles('admin','super_admin')`.
- Panel TIDAK menyimpan token di `localStorage`; hanya `user` (non-sensitif) untuk display.
- Tidak ada hardcoded URL backend di source panel — selalu `import.meta.env.VITE_API_URL`.
- Tidak menambah `v-html` dengan input user.

## Testing Strategy

- API: Jest + Supertest, `--runInBand`, DB MySQL `happybouquet_test`. Test baru wajib untuk `POST /customers` dan perubahan auth (login cookie, CSRF header, role check 403).
- Panel: Vitest. Tambah/adjust test composables yang berubah (useCustomer, useAuth, dsb).
- Verifikasi akhir: `npm run build` + `npm test` hijau di KEDUA repo.

## Boundaries

- **Always do**: verifikasi build+test kedua repo, respons format seragam, role check pada semua operasi admin, cookie `httpOnly; secure; sameSite=lax`, CSRF header pada method mutasi, catat changelog kedua repo, commit per step.
- **Ask first**: perubahan schema DB (tidak ada di siklus ini), menambah dependency baru di API/panel, perubahan CORS global, kebijakan rate limit, dan perubahan yang memengaruhi storefront Nuxt di luar dual-mode auth.
- **Never do**: commit secrets, taruh token di localStorage panel, biarkan endpoint admin tanpa role check, expose log server ke publik, pakai `res.json` langsung di controller (tanpa helper).

## Asumsi

1. Panel dan API di production same-site di bawah proxy/subdomain yang sama sehingga `SameSite=Lax` cukup (CORS_ORIGINS tetap diisi untuk panel origin).
2. Storefront Nuxt & API client lain TETAP memakai Bearer token (dual-mode) — tidak diubah di siklus ini.
3. `NODE_ENV=production` mengaktifkan pembatasan CORS + cookie `Secure` + blokir TikTok mock (sudah ada).
4. Semua tes membutuhkan MySQL lokal hidup (DB `happybouquet_test`).

## Success Criteria

- [ ] Semua endpoint yang dipanggil panel ada di API; tidak ada 404 mismatch (`POST /customers` tersedia).
- [ ] Tidak ada operasi tulis admin di API tanpa `authorizeRoles('admin','super_admin')` (kecuali endpoint reseller yang memang khusus).
- [ ] Semua respons API (termasuk 401/403 dari middleware) memakai `{ status, message, data, error }`.
- [ ] Panel login/logout memakai cookie httpOnly + CSRF header `X-Requested-With`; tidak ada token di localStorage; storefront Bearer tetap berfungsi.
- [ ] `/api/logs` tidak lagi publik (admin-only) tanpa merusak fitur logging frontend.
- [ ] Halaman baru panel: Reseller admin, Invoice, Notification, Logs — semua CRUD/baca dari API yang ada.
- [ ] Mock/placeholder dihapus atau di-gate `NODE_ENV`; hardcoded URL backend dihapus; `.env` panel masuk `.gitignore`.
- [ ] `npm run build` + `npm test` hijau di API (35+ test) dan panel (vitest).
- [ ] Changelog kedua repo + `.dev/known-issues.md` + `.dev/log/changelog.txt` diperbarui; commit per step.

## Open Questions (untuk ditangani saat implementasi)

- Format slug/number pada route reseller: `/api/reseller/clients/:id(\d+)` — panel harus kirim numeric id.
- Halaman Logs di panel: cukup menampilkan daftar file + isi (read-only) atau perlu fitur lain.
- Invoice di panel: perlu daftar semua invoice atau cukup link unduh dari detail order.
