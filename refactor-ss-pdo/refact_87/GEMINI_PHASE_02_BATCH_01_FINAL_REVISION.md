# Instruksi Gemini — penutupan Batch 2.1

Codex menerima perhitungan ritase, tes nilai 0, dan koreksi ID pada `refact_86`. Kerjakan **hanya R87-01** dari `refact_87/AUDIT_BUGS.md`, lalu kembali untuk review. Jangan mulai Batch 2.2.

1. Pastikan branch `devmode`. Pertahankan semua perubahan lokal dan folder dokumentasi lama. Buat `refactor-ss-pdo/refact_88` jika belum ada, atau nomor tertinggi + 1.
2. Di `MonitoringRouteDetailModal.tsx`, pindahkan label tampilan pada baris sekitar 441 (`S1: ... • S2: ...`), 515 (`Target: ... • Cap: ...`), dan 556 (`Capaian: ...%`) ke `TEXT_MONITORING.ROUTE_DETAIL_MODAL` dalam `src/constants/texts/text_monitoring.ts`. Untuk label yang mengandung angka, gunakan fungsi template murni sesuai `AGENTS.md`. Jaga kata, tanda baca, urutan, angka, dan format yang terlihat tetap sama. Jangan ubah kalkulasi nonritase.
3. Tambahkan uji integritas semua entri baru pada `src/constants/texts/texts.test.ts`. Cek sekali lagi JSX dan atribut yang terlihat pengguna di modal untuk literal lain. Kunci teknis, CSS, ID, dan komentar bukan teks UI.
4. Jalankan tes target dan full suite `pnpm run test --dir src`, `pnpm run lint`, `pnpm run build`, serta `graphify update .` setelah perubahan kode. Catat hasil aktual dan bandingkan warning lint dengan baseline 72. Di Windows, set TEMP/TMP hanya untuk proses PNPM bila diperlukan.
5. Tulis `AUDIT_BUGS.md` dan `REPAIR_REPORT.md` di folder baru: ID, lokasi, keparahan, dampak, mitigasi, implementasi, Before vs After, Case: Skenario Lapangan, daftar file berubah, dan bukti gate. Jangan edit `refact_84` sampai `refact_87`.

Kriteria PASS: semua label UI yang tampak pada modal target berasal dari kamus domain; perubahan hanya pada copy source, tes kamus, dan output graf yang diperlukan; perilaku angka ritase dan nonritase tetap sama.
