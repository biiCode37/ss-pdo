# Audit Gerbang Fase 3 Batch 3.1 dan Fokus Batch 3.2

**Status:** `BATCH_3_1_PASS / BATCH_3_2_READY`. Review pada branch `devmode`; tidak ada perubahan kode aplikasi oleh Codex pada putaran ini.

## R104-01 — Tes reproduksi historis mengganggu gerbang standar

- **Lokasi kode:** `vite.config.ts:1,79-81`; arsip bukti `refactor-ss-pdo/refact_103/evidence/`.
- **Keparahan:** Sedang.
- **Deskripsi:** Sebelumnya `pnpm run test` menemukan tes bukti yang sengaja mengharapkan bug lama.
- **Dampak user/tim:** Perintah tes standar gagal walau tes aplikasi lulus.
- **Mitigasi:** `test.exclude` menggunakan `...configDefaults.exclude` ditambah `refactor-ss-pdo/**`, sehingga arsip tetap utuh dan tes aktif tetap ditemukan.
- **Status review:** **CLOSED / PASS**. Codex menjalankan `pnpm run test`: 83 file/604 tes lulus, `pnpm run build`: exit 0, dan lint `vite.config.ts`: exit 0.

## R100-03 — Efek prefill odometer masih memiliki dependensi tidak lengkap

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:273-334` (empat `useEffect`); state/derivasi KM pada sekitar baris 90-270 dan 460-560.
- **Keparahan:** Sedang.
- **Deskripsi:** Empat `react-hooks/exhaustive-deps` warning menandakan efek membaca state KM tanpa mencantumkannya sebagai dependensi. Menambah dependensi secara langsung berisiko mengisi ulang input yang sengaja dikosongkan atau menciptakan loop.
- **Dampak user:** Prefill H-1, backspace, dan alur bus Shift 2 saja dapat berubah tanpa terlihat pada tes sederhana.
- **Mitigasi:** Batch 3.2 mengekstrak state dan perilaku odometer ke sub-hook fokus, dengan tes karakterisasi sebelum pergeseran logika. Empat warning dependensi harus selesai tanpa disable rule, sambil menjaga alur async H-1, copy antarshift, rollover, dan payload sanitasi.
- **Status:** **OPEN / BATCH 3.2**.

## Batas temuan lain

R100-04 pemecahan UI Single Focus tetap Batch 3.4; R100-05 shell modal tetap Batch 3.5. Tidak dipindahkan ke Batch 3.2.
