# Todo Audit & Refactor API Happy Bouquet

## Phase 1: Quick Wins
- [ ] Task 1: Standarkan format respons di `LogController.ts` (pakai successResponse/errorResponse)
- [ ] Task 2: Standarkan format respons di `tiktokAdmin.controller.ts` & `tiktokUser.controller.ts`
- [ ] Task 3: Hapus `isAdmin` inline di `adminRoutes.ts` → `authorizeRoles('admin', 'super_admin')`
- [ ] Task 4: Migrasi `registerSchema` & `materialSchema` ke `src/validators/`; hapus `utils/validation.ts` & `utils/types.ts`
- [ ] Task 5: Validasi body `login` dengan Zod; seragamkan pesan error Bahasa Indonesia

## Checkpoint: Phase 1
- [ ] `npm run build` sukses
- [ ] `npm test` hijau (--runInBand)

## Phase 2: Fitur Mock (keputusan user)
- [ ] Task 6: TikTok — sunset/disable rute atau implementasi nyata
- [ ] Task 7: Mock analytics di `socket.ts` hanya development; matikan di production

## Checkpoint: Phase 2
- [ ] Tidak ada data palsu bocor ke production
- [ ] Endpoint disabled tidak bisa diakses (403/404 jelas)

## Phase 3: Kerapian & Konsistensi
- [ ] Task 8: Kurangi `(req as any)` — perluas `AuthRequest`/`ResellerAuthRequest`
- [ ] Task 9: Seragamkan pesan & struktur try/catch di controller
- [ ] Task 10: Rapikan `server.ts` & hapus console.log sisa

## Checkpoint: Phase 3
- [ ] Build + test hijau
- [ ] `graphify update .` berjalan tanpa menyusut

## Phase 4: Ship
- [ ] Task 11: `npm run build` + `npm test` penuh
- [ ] Task 12: Catat `changelog.txt` + `.dev/log/changelog.txt`
- [ ] Task 13: `graphify update .`, commit per step (konvensi emoji)
