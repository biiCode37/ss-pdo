---
name: verify
description: Jalankan 4 quality gate wajib SS_PDO (kontrak warna, unit test, build, graphify) sebelum pekerjaan dianggap selesai. Pakai setelah setiap perubahan kode, audit, atau refactor.
---

# Verifikasi Zero-Mistake SS_PDO

Jalankan berurutan dari root repo. Berhenti di gate pertama yang gagal, laporkan output aslinya, lalu perbaiki akar masalahnya (jangan melemahkan tes).

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — kontrak kontras warna WCAG harus lulus 100%.
2. `pnpm vitest run src/` — seluruh unit test lulus 100%.
3. `pnpm run build` — `tsc -b` strict + Vite build 0 error. Jalankan di background bila lama.
4. `graphify update .` — perbarui graf pengetahuan kode.

Laporkan ringkas ke pengguna dalam tabel: gate, status (lulus/gagal), jumlah tes, dan catatan. Jangan menyatakan selesai tanpa bukti output dari keempat gate.
