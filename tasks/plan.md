# Implementation Plan: Audit & Refactor API Happy Bouquet

## Overview
Audit menyeluruh codebase (Express + TS + Sequelize) setelah analisis graphify + pemeriksaan manual. Tujuan: menghilangkan fitur duplikat/unused/tidak sesuai, menyamakan standar kode (respons format, middleware auth, validasi), dan menyiapkan production-readiness tanpa mengubah perilaku fitur inti.

## Temuan Audit (ringkas)
- **Fitur mock (tidak sesuai production):** modul TikTok seluruhnya mock (`tiktok.service.ts`, `tiktokAdmin.controller.ts`, `tiktokUser.controller.ts`), dan `socket.ts` menyiarkan data analytics palsu (`mockActiveCount`, `mockTrafficHistory`).
- **Duplikasi middleware auth:** `adminRoutes.ts` punya `isAdmin` inline yang hanya cek `role === 'admin'` (tidak support `super_admin`, pesan EN); padahal `authorizeRoles` sudah ada dan `resellerRoutes` sudah menggunakannya dengan benar.
- **Inkonsistensi format respons:** `LogController.ts`, `tiktokAdmin.controller.ts`, `tiktokUser.controller.ts` memakai `res.json` langsung, melanggar format global `{ status, message, data, error }`.
- **Validasi tersebar:** skema lama di `src/utils/validation.ts` (registerSchema, materialSchema) dipakai 3 controller; folder `src/validators/` berisi skema Zod lain. Tidak ada satu lokasi baku.
- **Inkonsistensi bahasa pesan:** campur EN (`"User registered successfully"`) dan ID (reseller, order).
- **Kerapian:** banyak `(req as any)`, `catch (err: any)`, `console.log` di TikTok, `logout` tanpa validasi input login (body langsung tanpa Zod).
- **Positif:** semua model terdaftar & dipakai (tidak ada model mati), tidak ada import cycle, tidak ada `@ts-ignore`.

## Architecture Decisions
- **TikTok:** kandidat utama deprecation/sunset. Belum dipakai frontend (modul panel TikTok hanya stub); keputusan: nonaktifkan rute + pindah ke flag, ATAU dihapus total — butuh keputusan user.
- **Mock analytics socket:** pertahankan sebagai fallback development dengan `NODE_ENV === 'production'` menampilkan data real dari Redis/DB; nonaktifkan mock di production.
- **Respons format:** semua controller wajib `successResponse`/`errorResponse`.
- **Auth role:** semua pengecekan admin memakai `authorizeRoles('admin', 'super_admin')`.
- **Validasi:** skema Zod bermigrasi ke `src/validators/` (satu lokasi baku); `utils/types.ts` dipindah/digabung.
- **Bahasa pesan:** seragam Bahasa Indonesia.

## Task List

### Phase 1: Quick Wins (aman, tanpa ubah perilaku)
- [ ] Task 1: Standarkan format respons di `LogController.ts`.
- [ ] Task 2: Standarkan format respons di `tiktokAdmin.controller.ts` & `tiktokUser.controller.ts`.
- [ ] Task 3: Hapus `isAdmin` inline di `adminRoutes.ts`, ganti `authorizeRoles('admin', 'super_admin')`.
- [ ] Task 4: Migrasi `registerSchema` & `materialSchema` ke `src/validators/`; hapus `utils/validation.ts` & `utils/types.ts` bila tidak dipakai lagi.
- [ ] Task 5: Validasi body `login` dengan Zod (pesan bahasa diseragamkan di Fase 3, karena test auth/material meng-assert pesan EN).

### Checkpoint: Phase 1
- [ ] `npm run build` sukses
- [ ] `npm test` hijau (--runInBand)

### Phase 2: Fitur Mock (keputusan user)
- [ ] Task 6: TikTok — sunset/disable rute atau implementasi nyata.
- [ ] Task 7: Mock analytics di `socket.ts` hanya untuk development; matikan di production.

### Checkpoint: Phase 2
- [ ] Tidak ada data palsu bocor ke production.
- [ ] Endpoint yang di-disable tidak bisa diakses tanpa 404/403 yang jelas.

### Phase 3: Kerapian & Konsistensi
- [ ] Task 8: Kurangi `(req as any)` — tambah `ResellerAuthRequest`/perluas `AuthRequest`.
- [ ] Task 9: Seragamkan pesan & struktur try/catch di controller.
- [ ] Task 10: Rapikan `server.ts` (migrasi manual jelas) & hapus komentar/console.log sisa.

### Checkpoint: Phase 3
- [ ] Build + test hijau
- [ ] `graphify update .` berjalan dan graph tidak mengecil

### Phase 4: Ship
- [ ] Task 11: Jalankan `npm run build` + `npm test` penuh.
- [ ] Task 12: Catat `changelog.txt` + `.dev/log/changelog.txt`.
- [ ] Task 13: `graphify update .`, commit per step dengan konvensi emoji.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Menghapus TikTok bisa memutus frontend yang belum/telah pakai | Med | Konfirmasi user; aktifkan flag & jaga respons 404 yang jelas |
| Mengubah respons LogController bisa memutus consumer log | Low | Pertahankan field yang sama di `data` |
| Migrasi skema bisa salah import | Low | Build + test tiap step |
| `npm test` butuh MySQL lokal hidup | Med | Verifikasi DB `happybouquet_test` sebelum test |

## Open Questions
- TikTok: **KEPUTUSAN USER (2026-08-08):** disable rute + flag, pertahankan stub untuk implementasi masa depan (Fase 2).
- Mock analytics socket: **KEPUTUSAN USER:** mock hanya di development; production pakai data real (Fase 2).
- Prioritas eksekusi: **KEPUTUSAN USER:** eksekusi Fase 1 saja sekarang (quick wins); Fase 2+ ditunda dengan plan siap.
