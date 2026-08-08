# Known Issues & Tech Debt

- [RESOLVED] Rate Limit di `app.ts` (Backend) masih dinonaktifkan. (Sudah diaktifkan kembali di `app.ts` dengan trust proxy).
- [RESOLVED] Belum ada file `.env.example` di backend maupun frontend. (Sudah dibuat beserta Redis URL).
- [RESOLVED] Sync worker `syncAnalyticsToDB` di backend masih berupa placeholder TODO dan belum menyimpan logs ke database SQL secara permanen. (Sudah diimplementasikan dengan membuat model AnalyticsLog dan menyimpan data mentah dari Redis ke MySQL).
- [ ] Storefront Nuxt `happybouquet` belum mengirimkan request tracking ke `/collect`, sehingga analytics dashboard admin masih mengandalkan mock data.
- [ ] Modul panel reseller di frontend belum dibuat (baru diimplementasikan di backend API).
- [RESOLVED] Detail error validasi hilang karena controller memakai `err.errors` (dihapus di Zod v4). (Diganti `err.issues` + kode `VALIDATION_ERROR` di 14 controller, commit `f20a7b2`.)
