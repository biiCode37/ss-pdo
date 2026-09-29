# Keputusan review akhir Batch 2.2 — Refact 93

Tanggal: 27 September 2026. Branch: `devmode`. Pelaksana: Codex (orchestrator).

**Status: PASS untuk Fase 2, Batch 2.2.** R91-01 dan R91-02 ditutup oleh implementasi serta tes `refact_92`. R91-03 ditutup setelah `git diff --check` bersih dan koreksi faktual R93-01 dicatat di folder baru ini. Codex tidak mengubah kode aplikasi atau arsip terdahulu.

## Implementasi review dan Before vs After

| Aspek | Before | After yang terverifikasi |
| --- | --- | --- |
| Duplikasi Shift 1/2 | `heroInputStyle`, `secondaryInputStyle`, dan `getChipStyle` diulang dalam dua komponen | `BusFormField` dan `ShiftOptionChip` dipakai di keduanya; state/rumus domain tetap di pemilik semula |
| Latar input | Hero: `background: "rgba(0, 0, 0, 0.35)"`; secondary: `background: "rgba(0, 0, 0, 0.25)"` | `BusFormField` memakai `var(--input-bg, rgba(0, 0, 0, 0.25))` untuk input aktif; token light/dark tersedia di `src/index.css` |
| Chip toggle | Warna berubah, status aktif tidak diumumkan | `<button type="button" aria-pressed={isActive}>`; native keyboard tetap tersedia |
| Tes Enter | Spy `onKeyDown` saja | Tes memakai `useBusInputForm` nyata dan membuktikan `requestSubmit()` dipanggil dari form terdekat |
| Tes Shift | Shift 2 locked/chip belum lengkap | Tes KM Akhir 2 disabled dan setter Manual/Catatan pada dua Shift |
| Kerapian diff | Blank line ekstra pada EOF dua file Shift | `git diff --check` exit 0; hanya peringatan normalisasi LF/CRLF Git |
| Dokumentasi historis | `refact_92` masih menulis `var(--input-bg, …)` sebagai style Before | Baris ini mengoreksi catatan tanpa menulis ulang arsip lama |

## Case: Skenario Lapangan

### Petugas memasukkan TOA lewat keyboard ponsel

Field bersama meneruskan Enter ke handler hook yang memanggil `requestSubmit()` pada form. Tes revisi menjalankan jalur ini, bukan hanya memeriksa spy event.

### Petugas membuka Shift 2 dengan KM Akhir terkunci

Ketika `isKmAkhir2Locked` bernilai benar, input KM Akhir 2 tetap disabled dan menampilkan placeholder terkunci. Tes baru memeriksa kedua hal tersebut.

### Petugas memakai pembaca layar pada chip Manual/Catatan

Chip tetap memakai tombol native dan sekarang memiliki `aria-pressed` sesuai status. Tes memeriksa keadaan aktif dan tidak aktif. Pengumuman kata persis oleh TalkBack/VoiceOver belum diuji pada perangkat fisik.

### Pemeriksaan visual tema ponsel

Token `--input-bg`, `--card-border`, dan `--text-primary` memiliki nilai light/dark di `src/index.css`. Codex menjalankan dev server lokal, namun aplikasi berhenti di layar login dengan tombol Google nonaktif, sehingga form Shift tidak dapat dilihat melalui alur UI. Tidak ada klaim kesetaraan visual hasil render. Risiko visual ini dicatat untuk uji perangkat saat preview terautentikasi tersedia.

## Verifikasi

- Branch `devmode`.
- Codex menjalankan tes target: **3 file / 41 tes lulus**, exit 0.
- Evidence executor `refact_92/evidence/`: full suite **75 file / 542 tes lulus**, lint terarah **0 warning / 0 error** pada 5 file, build exit 0, Graphify diperbarui. Full suite/build tidak dijalankan ulang oleh Codex pada review ini.
- `git diff --check` pada file Batch 2.2 tidak menemukan error whitespace.
- Root lint 1868 warning terkontaminasi `dist_old/`; hasil ini tidak dibandingkan dengan baseline root 72 warning sebelum folder tersebut hadir.

Paket berikutnya: `GEMINI_PHASE_02_BATCH_03.md`. Batch 2.3 boleh dimulai setelah pemilik proyek meneruskan paket tersebut kepada Gemini.
