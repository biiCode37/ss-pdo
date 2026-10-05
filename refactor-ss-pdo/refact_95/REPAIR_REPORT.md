# Laporan Review dan Rencana Perbaikan — Batch 2.3

**Status:** `REVISI_DIPERLUKAN`. Ini adalah review Codex; belum ada perubahan kode aplikasi atau perbaikan yang diklaim selesai pada `refact_95`.

## Implementasi yang diperiksa

Gemini telah menambahkan `scrollLockCoordinator`, `modalStackCoordinator`, `ModalShell`, dan memigrasikan `QueueModal` serta `ReportModalLayout`. Koordinator scroll menunjukkan reference counting, pelepasan idempotent, dan pemulihan overflow awal yang benar pada dua urutan uji. Kedua pilot memakai shell bersama. Namun, gerbang penerimaan tentang lifecycle form, lapisan modal, dan fokus belum terpenuhi (R95-01 sampai R95-03).

## Before vs After yang diperlukan pada revisi

| Aspek | Keadaan Batch 2.3 saat review | Hasil yang harus dibuktikan setelah revisi |
|---|---|---|
| Laporan `keepMounted` | Portal saat terbuka, inline saat tertutup pada produksi; tes selalu inline. | Lokasi subtree stabil; input dan state anak bertahan pada transisi buka/tutup produksi. |
| Modal bertumpuk | Queue memiliki `z-index:100`, laporan `99999`; stack dismiss memakai urutan buka. | Dialog yang terlihat paling atas menjadi satu-satunya target Escape dan Back. |
| Fokus | Fokus awal/pemulihan satu dialog sudah diuji; Tab dan tutup modal bawah belum diuji. | Fokus tetap di dialog aktif dan kembali ke pemicu setelah dialog terakhir ditutup. |
| Dokumentasi | Beberapa klaim `refact_94` tidak sesuai kode/tes. | Laporan revisi baru hanya mengklaim perilaku yang terbukti; arsip lama tetap utuh. |

## Case: Skenario Lapangan

1. **Draf laporan:** Petugas mengetik data laporan, menutup panel sebentar, lalu membukanya kembali. Verifikasi isi input, state lokal anak, dan posisi scroll yang relevan tidak hilang; ini menangani R95-01.
2. **Laporan lalu antrean:** Laporan terbuka, antrean sinkronisasi juga terbuka. Dialog yang tampak terdepan menerima tepat satu Escape/Back dan dialog di belakang tetap utuh; ini menangani R95-02.
3. **Tutup modal bawah lebih dulu:** A dan B terbuka; A tertutup lewat perubahan state sementara B tetap aktif. Fokus keyboard tetap di B; Tab/Shift+Tab tidak keluar ke dashboard; ini menangani R95-03.
4. **Serah terima audit:** Owner membaca status di dokumen revisi. Perbedaan antara hasil tes otomatis dan visual perangkat nyata jelas, dan tidak ada klaim palsu `aria-hidden`/Back/state; ini menangani R95-04.

## Verifikasi review

- Branch: `devmode`.
- Uji ulang **targeted**: 4 file, 22 tes lulus.
- Uji ulang suite dengan `pnpm run test -- ...` (CLI menjalankan seluruh suite): 81 file, 572 tes lulus. Happy DOM mencatat script Google API tidak dapat dimuat dalam lingkungan tes; proses tetap exit 0.
- `pnpm run build`: lulus, `tsc -b && vite build` exit 0.
- `git diff --check`: tidak ada whitespace error. Peringatan LF/CRLF bukan error diff.
- Tes yang lulus belum mencakup alur R95-01 sampai R95-03 di atas. Tidak ada verifikasi visual perangkat nyata pada review ini.

## Keputusan gerbang dan progres

Batch 2.3 **belum PASS**, sehingga Fase 2 belum ditutup. Berdasarkan enam fase pada `refact_82/IMPLEMENTATION_BATCHES.md`, **1 dari 6 fase telah tuntas resmi (16,7%)**. Batch 2.1 dan 2.2 lulus; Batch 2.3 menunggu revisi. Setelah Batch 2.3 lulus, progres berdasarkan jumlah fase menjadi **2 dari 6 (33,3%)**, dengan **4 fase tersisa** (Fase 3–6). Saat ini ada **5 fase belum tuntas**, termasuk Fase 2. Persentase ini adalah hitungan tonggak fase, bukan ukuran kualitas/volume seluruh codebase; beban Fase 3–6 tidak sama besar.
