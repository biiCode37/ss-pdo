# Paket Gemini — Fase 2, Batch 2.1: ritase PP dan label validasi

Codex telah meluluskan Fase 1 melalui `refact_83/REPAIR_REPORT.md`. Paket ini adalah **satu batch implementasi** untuk AntiGravity/Gemini. Setelah batch selesai, berhenti dan kembalikan hasil untuk review Codex sebelum Batch 2.2.

## Baca sebelum menyunting

1. `AGENTS.md` dan `.agents/AGENTS.md`, terutama branch `devmode`, kamus teks, ritase PP, parsing angka, dokumentasi `refact_N`, quality gates, dan Graphify.
2. `refact_82/IMPLEMENTATION_BATCHES.md` Batch 2.1 serta koreksinya di `refact_83/AUDIT_BUGS.md` R83-01/R83-02.
3. `refact_83/REPAIR_REPORT.md` dan evidence baseline terkait.

## Batas batch

Perbaiki dua jalur yang langsung berkaitan dengan akurasi tampilan dan pesan petugas:

1. Fallback total ritase pada `MonitoringRouteDetailModal.tsx`: prioritaskan `route.totalRitasePp` bila disediakan, termasuk nilai 0. Jika tidak ada, gunakan `route.totalTrips / 2` atau 0. Jangan pakai `Math.round`, `.toFixed`, atau pemotongan presisi dalam nilai domain.
2. Metrik ritase per bus di modal yang sama: pertahankan prioritas `route.ritasePerBus` eksplisit, lalu `route.tripsPerBus / 2`, lalu `totalRitasePp / realops` bila jumlah bus valid. Hilangkan `.toFixed(1)` pada tiga cabang ritase tersebut agar nilai seperti 5,05 tetap dapat tampil penuh. Jangan perluas perubahan ke metrik non-ritase dalam batch ini; catat kandidat audit angka lain untuk Fase 4.
3. Label validasi pada `useBusInputForm.ts`: ganti literal UI `"Shift 1"`, `"Shift 2"`, dan `"TOA Shift 2"` yang diteruskan ke fungsi validator/pesan user dengan entri `TEXT_ALERTS.BUS_INPUT_MODAL` yang ada atau ditambah sesuai domain. Tambahkan uji integritas entri baru di `src/constants/texts/texts.test.ts`. Jangan mengubah kunci teknis atau ID internal yang kebetulan memakai kata shift.

## File cakupan

- `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`
- `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`
- `src/components/busCard/modal/useBusInputForm.ts`
- `src/components/busCard/modal/useBusInputForm.test.tsx` bila tes perilaku label membutuhkan perubahan
- `src/constants/texts/text_alerts.ts`
- `src/constants/texts/texts.test.ts`
- File output `graphify-out/` yang memang diperbarui oleh `graphify update .` sesuai aturan proyek
- Dokumentasi `refactor-ss-pdo/refact_N/` baru untuk batch ini

Jika solusi memerlukan file source lain, jelaskan kebutuhan dan dampaknya pada laporan; jangan melakukan refactor layout, memindahkan modul, atau membuat komponen UI baru dalam batch ini.

## Prosedur kerja

1. Pastikan branch `devmode`. Catat HEAD, `git status --short`, dan diff file target sebelum bekerja. Pertahankan perubahan lokal yang ada; jangan reset/stash/clean. Nomor folder dokumentasi baru adalah maksimum `refact_N` saat mulai + 1 (perkiraan `refact_84`). Jangan menulis ulang laporan lama.
2. Tambahkan tes perilaku yang membedakan kondisi salah dari benar: 101 trip → 50,5 ritase PP; 100 → 50; 0 → 0; `totalRitasePp` eksplisit tetap prioritas; 50,5 / 10 bus → 5,05 ritase/bus; `tripsPerBus` 10,1 → 5,05; `ritasePerBus` eksplisit 5,05 tetap 5,05. Gunakan teks yang terlihat pada tab Produktivitas, dengan fixture yang tidak mengisi override turunan pada kasus fallback.
3. Implementasikan perubahan minimal. Hindari utilitas atau hook baru untuk ekspresi pembagian sederhana. Jangan menyimpan string hasil formatting sebagai nilai domain.
4. Telusuri seluruh pemanggil validator dan literal terkait di `src/` sesudah migrasi (`rg` atau Graphify). Pastikan label yang muncul pada kesalahan memakai kamus; uji entri baru pada `texts.test.ts`. Untuk tes hook, verifikasi keluaran yang terlihat/relevan dan jangan membuat tes yang sekadar mengulang baris implementasi.
5. Jalankan tes target, lalu `pnpm run test --dir src`, `pnpm run lint`, dan `pnpm run build`. Di Windows, PNPM pernah membutuhkan `TEMP/TMP` proses yang diarahkan ke folder writable di `node_modules/.tmp`; gunakan hanya bila error lingkungan itu muncul. Tidak perlu mengubah setting mesin permanen. Catat exit code, jumlah tes, warning yang tersisa, dan bandingkan baseline 74 file / 524 tes serta 72 warning lint.
6. Jalankan `graphify update .` setelah perubahan kode. Bandingkan outputnya dengan perubahan lokal awal dan laporkan file graf yang berubah.
7. Tulis `AUDIT_BUGS.md` dan `REPAIR_REPORT.md` pada folder baru. Sertakan ID R79-05/R79-06/R83-01/R83-02, lokasi, keparahan, dampak user, mitigasi, implementasi, **Before vs After**, serta **Case: Skenario Lapangan** untuk setiap koreksi. Lampirkan hasil tes dan batas yang belum diverifikasi.

## Kriteria review Codex

- Perhitungan total ritase dan ritase per bus sesuai istilah PP, prioritas sumber, dan presisi.
- Kamus baru teruji dan tidak ada literal UI pada pemanggil validasi yang disentuh.
- Diff terfokus; source di luar batch dan perubahan lokal lain tetap aman.
- Test target dan suite lulus, build lulus, lint tanpa error/warning baru, graf diperbarui atau kegagalan tool dicatat secara jujur.
- Dokumentasi batch lengkap dan status akhir `READY_FOR_REVIEW` atau `BLOCKED` dengan alasan spesifik.

Kembalikan path folder laporan dan daftar file source yang berubah. Codex akan memeriksa diff dan bukti sebelum mengeluarkan paket Batch 2.2.
