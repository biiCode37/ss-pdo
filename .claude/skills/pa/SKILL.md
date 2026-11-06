---
name: pa
description: Perintah "PA" (Push All) — commit, push devmode, merge devmode ke main, push main, lalu kembali ke devmode. Hanya dipakai ketika pengguna mengetik PA atau /pa.
disable-model-invocation: true
---

# PA — Push All

Jalankan berurutan. Pastikan mulai dari branch `devmode` (`git branch --show-current`).

1. `git status` → jika ada perubahan, stage file yang relevan (jangan file rahasia seperti `.env` atau `ss-pdo-*.json`) lalu commit dengan pesan konvensional bahasa Indonesia (`feat:`, `fix:`, `docs:`, `chore:`).
2. `git push origin devmode`
3. `git switch main`
4. `git pull --ff-only origin main`
5. `git merge devmode` (tanpa `--no-verify`)
6. `git push origin main`
7. `git switch devmode`

**Klausul keselamatan (wajib):** jika ada langkah gagal atau janggal — konflik merge, push ditolak, hook gagal, working tree kotor di main, pull tidak fast-forward — BERHENTI. Jangan memutuskan sendiri. Laporkan masalahnya beserta rekomendasi solusi, tunggu keputusan pengguna, dan pastikan kembali ke `devmode` bila aman.

Akhiri dengan ringkasan: hash commit, status push devmode dan main, branch aktif.
