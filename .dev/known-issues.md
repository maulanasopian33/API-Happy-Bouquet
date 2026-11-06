# Known Issues & Tech Debt

- [RESOLVED] (Audit 2026-10-30) File invoice PDF tersimpan di direktori publik dan dapat diakses siapa saja via URL tanpa login. (Dipindahkan ke storage privat storage/invoices/ dan hanya dapat diakses melalui handler terautentikasi GET /api/invoices/:orderId/download).
- [RESOLVED] (Audit 2026-10-30) Notifikasi realtime sebelumnya menggunakan WebSocket tanpa otentikasi. (Diganti menggunakan Server-Sent Events (SSE) terisolasi per-user di GET /api/notifications/stream; Socket.io analytics kini dilindungi JWT).
- [RESOLVED] (Audit 2026-10-30) Parameter include_costs=true membocorkan HPP dan margin ke publik. (Dibatasi hanya untuk role admin/super_admin).
- [RESOLVED] (Audit 2026-10-30) Upload file menerima file SVG (vektor XSS) dan ekstensi sewenang-wenang. (Dibatasi hanya untuk ekstensi gambar JPG, PNG, WEBP dengan MIME type yang valid).
- [RESOLVED] (Audit 2026-10-30) Workflow deploy CI/CD gagal karena missing npm run build dan folder dist/. (Disinkronkan dengan struktur CommonJS src/ dan skrip build dummy).

- [RESOLVED] Deploy CI masih pakai FTP. (Menggantikan ke SSH rsync `easingthemes/ssh-deploy@v5.1.0` via cPanel SSH Access port 3759 — upload lebih cepat.)

- [RESOLVED] Rate Limit di `app.ts` (Backend) masih dinonaktifkan. (Sudah diaktifkan kembali di `app.ts` dengan trust proxy).
- [RESOLVED] Belum ada file `.env.example` di backend maupun frontend. (Sudah dibuat beserta Redis URL).
- [RESOLVED] Sync worker `syncAnalyticsToDB` di backend masih berupa placeholder TODO dan belum menyimpan logs ke database SQL secara permanen. (Sudah diimplementasikan dengan membuat model AnalyticsLog dan menyimpan data mentah dari Redis ke MySQL).
- [ ] Storefront Nuxt `happybouquet` belum mengirimkan request tracking ke `/collect`, sehingga analytics dashboard admin masih mengandalkan mock data.
- [RESOLVED] Modul panel reseller di frontend belum dibuat (baru diimplementasikan di backend API). (Phase F: halaman `/admin/resellers` sudah ada di panel.)
- [RESOLVED] Detail error validasi hilang karena controller memakai `err.errors` (dihapus di Zod v4). (Diganti `err.issues` + kode `VALIDATION_ERROR` di 14 controller, commit `f20a7b2`.)
- [ ] TikTok belum terintegrasi API resmi — masih mock, diblokir 403 di production (`bfa43f3`). Perlu integrasi OAuth/publish nyata bila fitur dipakai produksi.
- [ ] Media Kreator: `jimp` belum diuji di Passenger/shared hosting produksi. Risiko RAM < 256 MB saat render 2048 px; uji setelah deploy dan turunkan batas ukuran bila perlu.
- [RESOLVED] Mock analytics di `socket.ts` bocor ke production. (Kini produksi baca data nyata Redis, mock hanya dev, commit `878c03a`.)
- [RESOLVED] Banyak `(req as any)` di controller. (Dihilangkan via `AuthRequest.reseller` + `req.reseller!.id`, commit `9a84a49`.)
- [RESOLVED] `console.log` sisa di redis/tiktok/encryption. (Diganti logger winston, commit `3e25ec1`.)
- [RESOLVED] Test flaky: `beforeAll` (sync `{force:true}` + setup) kalah timeout 5s Jest saat suite penuh. (Fix `testTimeout: 30000` di `jest.config.js`; 35/35 stabil 2x berturut-turut.)
- [ ] Panel register publik (`/register`) dihapus — pembuatan akun staf lewat `/users`. Storefront Nuxt bebas membuat akun customer sendiri.
- [RESOLVED] Halaman Logs (admin) di panel belum ada — API `/logs` sudah siap. (Phase F: halaman `/logs` sudah ada di panel.)
