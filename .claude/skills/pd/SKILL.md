---
name: pd
description: Perintah "PD" (Push Devmode saja) — hanya git push origin devmode. Hanya dipakai ketika pengguna mengetik PD atau /pd.
disable-model-invocation: true
---

# PD — Push Devmode Saja

1. Pastikan branch aktif `devmode` (`git branch --show-current`). Jika bukan, berhenti dan laporkan.
2. Jika ada perubahan belum di-commit, tanyakan ke pengguna apakah perlu di-commit dulu.
3. `git push origin devmode`

Dilarang menyentuh, switch, merge, atau push ke `main` dalam perintah ini. Jika push gagal, laporkan error asli dan rekomendasi solusi, lalu tunggu keputusan pengguna.
