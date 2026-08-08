# Todo Audit & Refactor API Happy Bouquet

## Phase 1: Quick Wins
- [x] Task 1: Standarkan format respons di `LogController.ts` (pakai successResponse/errorResponse)
- [x] Task 2: Standarkan format respons di `tiktokAdmin.controller.ts` & `tiktokUser.controller.ts`
- [x] Task 3: Hapus `isAdmin` inline di `adminRoutes.ts` → `authorizeRoles('admin', 'super_admin')`
- [x] Task 4: Migrasi `registerSchema` & `materialSchema` ke `src/validators/`; hapus `utils/validation.ts` & `utils/types.ts`
- [x] Task 5: Validasi body `login` dengan Zod; seragamkan pesan error Bahasa Indonesia

## Checkpoint: Phase 1
- [x] `npm run build` sukses
- [x] `npm test` hijau (--runInBand) — 35/35 lulus

## Fase 1 Bonus (ditemukan saat checkpoint)
- [x] Fix bug Zod v4: `err.errors` -> `err.issues` + kode `VALIDATION_ERROR` (30 kemunculan, 14 controller)

## Phase 2: Fitur Mock (keputusan user)
- [x] Task 6: TikTok — sunset/disable rute (diblokir 403 di production, mock tetap di dev)
- [x] Task 7: Mock analytics di `socket.ts` hanya development; production baca data nyata dari Redis

## Checkpoint: Phase 2
- [x] Tidak ada data palsu bocor ke production
- [x] Endpoint disabled tidak bisa diakses (403/404 jelas)
- [x] Build + test hijau (35/35)

## Phase 3: Kerapian & Konsistensi
- [x] Task 8: Kurangi `(req as any)` — perluas `AuthRequest` (field `reseller`) + `req.reseller!.id`
- [x] Task 9: Seragamkan blok ZodError -> helper `validationErrorResponse`; LogController typed logger
- [x] Task 10: Rapikan `server.ts` & ganti console.log -> logger

## Checkpoint: Phase 3
- [x] Build + test hijau
- [x] `graphify update .` berjalan tanpa menyusut

## Phase 4: Ship
- [ ] Task 11: `npm run build` + `npm test` penuh
- [ ] Task 12: Catat `changelog.txt` + `.dev/log/changelog.txt`
- [ ] Task 13: `graphify update .`, commit per step (konvensi emoji)
