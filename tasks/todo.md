# Todo: Audit & Production-Ready Panel Happy Bouquet

## Phase A: Backend — Mismatch & Otorisasi
- [ ] Task A1: Tambah `POST /api/customers` (controller + validator + route + test)
- [ ] Task A2: Tambah `authorizeRoles('admin','super_admin')` pada route tulis admin yang kurang
- [ ] Task A3: Seragamkan format respons middleware auth + errorHandler ke `{status,...}`

## Checkpoint A
- [ ] `npm run build` sukses; `npm test` hijau

## Phase B: Backend — Cookie Auth (Dual-mode) & CSRF
- [ ] Task B1: Pasang cookie-parser; config cookie
- [ ] Task B2: authenticateToken dukung cookie sebagai fallback Bearer
- [ ] Task B3: login set cookie; logout clear cookie (token tetap di body)
- [ ] Task B4: Middleware csrfGuard (X-Requested-With pada mutasi)
- [ ] Task B5: CORS credentials + test auth

## Checkpoint B
- [ ] `npm run build` sukses; `npm test` hijau

## Phase C: Backend — Proteksi Logs
- [x] Task C1: GET /api/logs & /:date admin-only; POST tetap publik + rate limit

## Checkpoint C
- [ ] `npm run build` sukses; `npm test` hijau; changelog API + known-issues

## Phase D: Panel — Auth Cookie & Perbaikan Dasar
- [x] Task D1: apiClient axios → withCredentials + X-Requested-With; hapus token localStorage
- [x] Task D2: Semua service/composable fetch → util terpusat (credentials + header)
- [x] Task D3: auth.store tanpa token localStorage; guard router sesuaikan
- [x] Task D4: .env → .gitignore; hapus hardcoded URL backend

## Checkpoint D
- [x] `npm run build` sukses + `npm test` (12/12) hijau di panel; commit `2ceddf2`

## Phase E: Panel — Fitur & Bug
- [x] Task E1: Fix PDF export Finance (field snake_case)
- [x] Task E2: Hapus/gate mock dashboard & customer order history
- [x] Task E3: Tambah route 404 catch-all
- [x] Task E4: Evaluasi /register publik panel

## Checkpoint E
- [x] Build + test hijau di panel (12/12) & API (48/48)

## Phase F: Panel — Modul Baru
- [x] Task F1: Halaman Reseller admin (list/approve/reject/suspend/tier + tier prices)
- [x] Task F2: Halaman Invoice (daftar + link unduh PDF)
- [x] Task F3: Halaman Notification (daftar notifikasi)
- [x] Task F4: Halaman Logs (daftar file + lihat isi)

## Checkpoint E+F
- [x] Build + test hijau di panel
- [ ] Build + test hijau di API
- [ ] Manual check login → semua menu, tanpa 404

## Phase G: Ship
- [ ] Task G1: Update docs knowledge base (format respons & endpoint baru)
- [ ] Task G2: Update changelog kedua repo + known-issues + todo
- [ ] Task G3: graphify update + commit per step (emoji konvensional)
