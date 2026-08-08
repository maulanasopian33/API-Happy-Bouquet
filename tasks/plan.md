# Implementation Plan: Audit & Production-Ready Panel Happy Bouquet

## Overview

Menyelaraskan Admin Panel (Vue 3) dengan API backend dan mengamankannya untuk production. Berdasarkan audit dua codebase. Spec: `tasks/specs/audit-panel-production.md`.

## Arsitektur & Keputusan Kunci

1. **Dual-mode auth**: middleware `authenticateToken` baca token dari **cookie httpOnly** (`token`) ATAU header `Authorization: Bearer`. Login set cookie; logout clear cookie. Storefront Nuxt tetap Bearer.
2. **CSRF**: cookie `SameSite=Lax; httpOnly; secure(prod)`. Middleware `csrfGuard` mewajibkan header `X-Requested-With` pada method mutasi (POST/PUT/PATCH/DELETE) bila origin adalah browser (cookie-based). Header ini tidak bisa dikirim cross-origin tanpa persetujuan CORS → mencegah CSRF.
3. **Format respons seragam**: ubah `authenticateToken`, `authorizeRoles`, `requireActiveReseller`, dan `errorHandler` agar memakai shape `{ status, message, data, error }` — konsisten dengan `successResponse`/`errorResponse`.
4. **Otorisasi**: tambah `authorizeRoles('admin','super_admin')` pada semua route tulis admin yang kurang.
5. **Endpoint baru**: `POST /api/customers` (createCustomer + validator Zod).
6. **Logs**: `GET /api/logs` & `GET /api/logs/:date` → admin-only; `POST /api/logs` (log dari frontend) tetap publik dengan rate limit.

## Task List

### Phase A: Backend — Mismatch & Otorisasi
- [ ] Task A1: Tambah `POST /api/customers` (controller `createCustomer` + validator Zod + route + test).  **Depends:** none
- [ ] Task A2: Tambah `authorizeRoles('admin','super_admin')` pada route tulis admin yang kurang: products (create/update/delete/cost-templates/channels), orders (confirm-payment/status/pay-worker-fees/allocate-profit + baca), materials (tulis+baca), categories (tulis), promos (tulis), banners (tulis), channels (tulis), financial (tulis+baca), reports, invoices, notifications. **Depends:** none
- [ ] Task A3: Seragamkan format respons middleware auth (`authenticateToken`, `authorizeRoles`, `requireActiveReseller`) + `errorHandler` ke `{status,message,data,error}`. Perbarui test yang assert shape lama. **Depends:** none

### Checkpoint A
- [ ] `npm run build` sukses; `npm test` hijau

### Phase B: Backend — Cookie Auth (Dual-mode) & CSRF
- [ ] Task B1: Pasang `cookie-parser`; config cookie (`httpOnly`, `secure` di prod, `sameSite:'lax'`, `maxAge`).
- [ ] Task B2: `authenticateToken` mendukung cookie `token` sebagai fallback setelah Bearer header.
- [ ] Task B3: `login` set cookie; `logout` clear cookie (dua-duanya tetap return token di body agar storefront tetap jalan).
- [ ] Task B4: Middleware `csrfGuard` — wajib `X-Requested-With` pada method mutasi via cookie; bypass untuk Bearer-only.
- [ ] Task B5: CORS `credentials: true` sudah aktif; pastikan `CORS_ORIGINS` diisi panel origin di prod. Test auth (login cookie, CSRF 403 tanpa header, Bearer tetap jalan).

### Checkpoint B
- [ ] `npm run build` sukses; `npm test` hijau

### Phase C: Backend — Proteksi Logs
- [ ] Task C1: `GET /api/logs` & `GET /api/logs/:date` → `authenticateToken + authorizeRoles('admin','super_admin')`; `POST /api/logs` tetap publik + rate limit.

### Checkpoint C
- [ ] `npm run build` sukses; `npm test` hijau; catat changelog API + `.dev/known-issues.md`

### Phase D: Panel — Auth Cookie & Perbaikan Dasar
- [ ] Task D1: `apiClient` (axios) → `withCredentials: true`; hapus interceptor token localStorage; tambah header `X-Requested-With` pada request; 401 handler → hapus session.
- [ ] Task D2: Semua service/composable `fetch()` → pakai `withCredentials` (credentials:'include') + header `X-Requested-With`; hapus `getHeaders()` token localStorage. Satu util `apiFetch`/`apiClient` terpusat.
- [ ] Task D3: `auth.store` — hapus token dari localStorage; login pakai cookie; `verifySession` pakai `/auth/me`; guard router sesuaikan.
- [ ] Task D4: `.env` → `.gitignore` + `.env.example` (sudah ada); hapus hardcoded URL `localhost:3000/5000/127.0.0.1` → `VITE_API_URL` fallback `/api`.

### Phase E: Panel — Fitur & Bug
- [ ] Task E1: Fix PDF export Finance (field snake_case mapping).
- [ ] Task E2: Hapus/gate mock: dashboard top products/chart → ambil dari API (`/reports/summary` dsb); `useCustomerDetail` order history → API nyata.
- [ ] Task E3: Tambah route 404 catch-all.
- [ ] Task E4: Evaluasi `/register` publik panel — batasi akses (guard atau hapus menu) agar tidak memunculkan akun customer dari panel.

### Phase F: Panel — Modul Baru (Reseller, Invoice, Notification, Logs)
- [ ] Task F1: Halaman **Reseller admin** (list/approve/reject/suspend/tier + tier prices).
- [ ] Task F2: Halaman **Invoice** (daftar + link unduh PDF per order).
- [ ] Task F3: Halaman **Notification** (daftar notifikasi user login).
- [ ] Task F4: Halaman **Logs** (daftar file + lihat isi, admin).

### Checkpoint E+F
- [ ] `npm run build` + `npm test` hijau di panel
- [ ] `npm run build` + `npm test` hijau di API
- [ ] Manual: login → semua menu berfungsi, tidak ada 404

### Phase G: Ship
- [ ] Task G1: Update `docs/api_routes_kb.md` & `docs/kb_routes_produk.md` (format respons baru, endpoint baru).
- [ ] Task G2: Update `changelog.txt` kedua repo + `.dev/log/changelog.txt` + `.dev/known-issues.md` + `tasks/todo.md`.
- [ ] Task G3: `graphify update .` (API), commit per step (konvensi emoji, Bahasa Indonesia).

## Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Cookie tidak terkirim lintas-port di dev (Vite proxy) | Login gagal di dev | Proxy Vite sudah same-origin `/api`; pastikan cookie tidak butuh `secure` di dev |
| Storefront Nuxt rusak akibat dual-mode | Breaking change | Bearer header tetap didukung penuh; tes auth mencakup keduanya |
| CSRF terlalu ketat | Request panel ditolak | Hanya wajib `X-Requested-With` pada method mutasi; Bearer-only dibypass |
| Mengubah shape 401/403 | Panel redudant | Panel disesuaikan sekaligus; test diperbarui |
| Modul baru (reseller/invoice/log) besar | Scope membengkak | Implementasi bertahap per modul; commit per halaman |

## Open Questions

- Detail UI halaman Logs (daftar file + isi saja?).
- Invoice di panel: daftar semua invoice atau cukup dari detail order.
