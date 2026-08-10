# Spec: Migrasi Deployment GitHub Actions — FTP → SSH Access cPanel

## Objective

Mengganti protokol upload CI pada `.github/workflows/deploy.yml` dari FTP (`SamKirkland/FTP-Deploy-Action`) menjadi **SSH (cPanel SSH Access)** agar upload ke cPanel jauh lebih cepat (rsync inkremental, satu koneksi SSH, tanpa overhead per-file FTP).

Riwayat: SSH pernah dicoba lalu di-revert ke FTP (`d566544`, alasan "SSH firewall block"). Sekarang port SSH non-standar **3759** sudah terbuka di firewall, sehingga bisa diaktifkan kembali.

User: DevOps/owner repo. Success = tag `v*` memicu build → rsync inkremental (termasuk `node_modules` produksi) → restart Passenger, tanpa regresi.

## Keputusan yang Sudah Disepakati User

| Area | Keputusan |
|---|---|
| Protokol | SSH (cPanel SSH Access), bukan FTP |
| Port | **3759** (non-standar) — via secret `SSH_PORT` |
| node_modules | **Upload siap pakai**: `npm prune --production` di CI lalu rsync inkremental `node_modules` ke server (bukan `npm install` di server) |
| Action | `easingthemes/ssh-deploy@v5.1.0` (rsync over ssh, NodeJS — lebih cepat dari versi Docker) |
| Secrets | `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_TARGET_DIR` (menggantikan `FTP_*`) |
| Restart | File `tmp/restart.txt` dibuat di dalam folder deploy → ikut ter-rsync (Passenger restart trigger) |

## Tech Stack

GitHub Actions (ubuntu-latest), `actions/checkout@v4`, `actions/setup-node@v4` (Node 18), `npm ci` + `npm run build` + `npm prune --production`, `easingthemes/ssh-deploy@v5.1.0`.

## Commands

```bash
# Validasi YAML workflow (tidak ada linter CI lokal; validasi manual + build tidak terpengaruh)
# Verifikasi riwayat: html
git log --oneline -- .github/workflows/deploy.yml
```

## Project Structure

- `.github/workflows/deploy.yml` — satu-satunya file yang berubah (tambah `deploy/tmp/restart.txt` di step prepare).
- `.dev/known-issues.md`, `changelog.txt`, `.dev/log/changelog.txt`, `.dev/decisions.md`, `.dev/roadmap/deploy-ssh.md` — dokumen pendukung (update status).
- `AGENTS.md` — update bullet deployment (FTP → SSH).

## Code Style

```yaml
- name: Deploy to Server via SSH
  uses: easingthemes/ssh-deploy@v5.1.0
  with:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    ARGS: "-avzr --delete"
    SOURCE: "deploy/"
    REMOTE_HOST: ${{ secrets.SSH_HOST }}
    REMOTE_USER: ${{ secrets.SSH_USER }}
    REMOTE_PORT: ${{ secrets.SSH_PORT }}
    TARGET: ${{ secrets.SSH_TARGET_DIR }}
    EXCLUDE: "/.git*/"
```

Aturan:
- Step prepare tetap sama seperti FTP (dist, package.json, package-lock.json, migrations, seeders, `.sequelizerc`) **plus** `node_modules` hasil prune dan `deploy/tmp/restart.txt`.
- Menghapus step upload FTP; tidak ada `npm install` di server (node_modules sudah dikirim).
- Secrets SSH di-hardcode name-nya konsisten (`SSH_*`), tidak nilai aktual.

## Testing Strategy

- Tidak ada test otomatis untuk workflow CI (perlu GitHub + server). Verifikasi:
  1. `git diff` workflow benar.
  2. `npm run build` + `npm test` tidak terpengaruh (tidak menyentuh kode).
  3. Manual run oleh user: push tag `v*`, pantau job GitHub Actions (SSH connect port 3759 → rsync → restart).
  4. Rollback bila gagal: revert commit `deploy.yml` ke versi FTP.

## Boundaries

- **Always do**: catat changelog (root + `.dev/log`), update `.dev/decisions.md` & `roadmap/deploy-ssh.md` jadi status aktif/manual, commit per step, dokumentasikan secrets baru.
- **Ask first**: mengubah port aktif (harus sesuai firewall), menghapus secret FTP dari GitHub (milik user), menambah node install step di server.
- **Never do**: commit secret/private key, menaruh nilai host/user/port aktual di workflow, mengubah trigger dari `v*`.

## Asumsi

1. RIP: password-protected private key TIDAK didukung — key SSH harus tanpa passphrase (format PEM).
2. Public key SSH user GitHub harus sudah ditambahkan ke `~/.ssh/authorized_keys` di cPanel (SSH Access).
3. `SSH_TARGET_DIR` menunjuk ke root aplikasi (bukan home user) — aman untuk flag rsync `--delete`.
4. Port 3759 (dan bukan 22) yang dipakai ssh-deploy untuk koneksi.

## Success Criteria

- [ ] `deploy.yml` memakai `easingthemes/ssh-deploy@v5.1.0` + secrets `SSH_*`, tanpa FTP.
- [ ] Step prepare meng-hasilkan `deploy/` berisi: `dist`, `node_modules` (prune), `package*.json`, `migrations`, `seeders`, `.sequelizerc`, `tmp/restart.txt`.
- [ ] `tmp/restart.txt` ikut ter-rsync sehingga Passenger restart otomatis.
- [ ] AGENTS.md, `changelog.txt`, `.dev/log/changelog.txt`, `.dev/decisions.md`, `.dev/roadmap/deploy-ssh.md`, `.dev/known-issues.md` diperbarui.
- [ ] Commit per step (konvensi emoji, Bahasa Indonesia).

## Open Questions

- Apakah secret `FTP_*` perlu dihapus dari GitHub setelah SSH jalan? (keputusan pengguna)