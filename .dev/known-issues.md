# Known Issues & Tech Debt

- [RESOLVED] Rate Limit di `app.ts` (Backend) masih dinonaktifkan. (Sudah diaktifkan kembali di `app.ts` dengan trust proxy).
- [RESOLVED] Belum ada file `.env.example` di backend maupun frontend. (Sudah dibuat beserta Redis URL).
- [RESOLVED] Sync worker `syncAnalyticsToDB` di backend masih berupa placeholder TODO dan belum menyimpan logs ke database SQL secara permanen. (Sudah diimplementasikan dengan membuat model AnalyticsLog dan menyimpan data mentah dari Redis ke MySQL).
- [ ] Storefront Nuxt `happybouquet` belum mengirimkan request tracking ke `/collect`, sehingga analytics dashboard admin masih mengandalkan mock data.
- [ ] Modul panel reseller di frontend belum dibuat (baru diimplementasikan di backend API).
- [RESOLVED] Detail error validasi hilang karena controller memakai `err.errors` (dihapus di Zod v4). (Diganti `err.issues` + kode `VALIDATION_ERROR` di 14 controller, commit `f20a7b2`.)
- [ ] TikTok belum terintegrasi API resmi — masih mock, diblokir 403 di production (`bfa43f3`). Perlu integrasi OAuth/publish nyata bila fitur dipakai produksi.
- [RESOLVED] Mock analytics di `socket.ts` bocor ke production. (Kini produksi baca data nyata Redis, mock hanya dev, commit `878c03a`.)
- [RESOLVED] Banyak `(req as any)` di controller. (Dihilangkan via `AuthRequest.reseller` + `req.reseller!.id`, commit `9a84a49`.)
- [RESOLVED] `console.log` sisa di redis/tiktok/encryption. (Diganti logger winston, commit `3e25ec1`.)
- [RESOLVED] Test flaky: `beforeAll` (sync `{force:true}` + setup) kalah timeout 5s Jest saat suite penuh. (Fix `testTimeout: 30000` di `jest.config.js`; 35/35 stabil 2x berturut-turut.)
- [ ] Panel register publik (`/register`) dihapus — pembuatan akun staf lewat `/users`. Storefront Nuxt bebas membuat akun customer sendiri.
- [ ] Halaman Logs (admin) di panel belum ada — API `/logs` sudah siap (Phase F).
