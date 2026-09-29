# Laporan Review dan Rencana Perbaikan — Revisi Batch 2.3

**Status:** `REVISI_DIPERLUKAN`. Ini laporan audit Codex; tidak ada perubahan kode aplikasi pada `refact_97`.

## Implementasi yang diperiksa

Revisi Gemini `refact_96` telah menstabilkan portal Report, mempertahankan input/state anak pada transisi buka/tutup, menambah focus trap dan tes integrasi dua pilot. Namun, urutan stack keyboard masih dapat berubah ketika callback `onClose` dari parent berganti, sedangkan z-index modal tetap. Karena syarat topmost dismissal adalah gerbang Batch 2.3, batch belum bisa diluluskan.

## Before vs After yang diperlukan

| Aspek | Keadaan saat review | Hasil setelah revisi yang harus dibuktikan |
|---|---|---|
| Queue lalu Report lewat dua render | Report tampil di depan; Queue terdaftar terakhir di stack Escape setelah callback parent berubah. | Report tampil di depan dan menjadi satu-satunya target Escape maupun Back. |
| Registrasi modal | Efek keyboard bergantung pada identitas fungsi `onClose`; rerender dapat memindahkan entri stack. | Posisi stack tetap selama modal masih terbuka; callback terbaru tetap dipakai. |
| Kalkulasi z-index | Ref dibaca/ditulis saat render; tujuh peringatan `react(refs)` baru. | Layer stabil tanpa peringatan lint baru dan tanpa ketergantungan pada efek modal lain yang belum terdaftar. |
| Laporan lint | Bukti: 11 warnings, 0 errors; laporan mengklaim bebas peringatan baru. | Angka dan sumber peringatan dilaporkan tepat pada folder revisi baru. |

## Case: Skenario Lapangan

1. **Petugas membuka antrean lalu laporan:** Queue aktif, dashboard merender ulang, kemudian Report dibuka. Report yang terlihat paling depan harus menerima Escape/Back; Queue tetap terbuka sampai aksi berikutnya. Ini menguji R97-01.
2. **Dua modal terbuka dalam satu transaksi state:** Urutan visual, Escape, dan Back tetap sama saat kedua modal muncul pada commit yang sama. Ini menguji R97-02 dan menutup celah tes sebelumnya.
3. **Data dashboard berubah saat dua dialog aktif:** Callback `onClose` baru dari render parent tidak boleh mengubah urutan modal tanpa tindakan pengguna. Ini menguji R97-01.
4. **Serah terima kualitas:** Owner melihat hasil targeted lint yang benar, termasuk peringatan historis terpisah dari peringatan baru. Ini menguji R97-03.

## Verifikasi review

- Branch `devmode`.
- Uji ulang target: 6 file, 31 tes lulus.
- `pnpm run build`: lulus (`tsc -b && vite build`, exit 0).
- Bukti Gemini: suite penuh 81 file/573 tes lulus; targeted lint 11 warnings/0 errors. Tujuh peringatan baru menunjuk `ModalShell.tsx`.
- Probe tambahan: `evidence/stack-order-reproduction.case.tsx` dijalankan sebagai satu tes Vitest dan lulus ketika memeriksa ketidaksesuaian nyata antara z-index dan stack. File disimpan sebagai `.case.tsx` agar tidak otomatis menjadi bagian suite aplikasi.
- Verifikasi visual ponsel fisik dan dua tema belum dilakukan pada review ini.

## Keputusan

Batch 2.3 tetap **belum PASS**. Fase 2 belum ditutup. Berdasarkan enam fase roadmap `refact_82`, fase resmi yang selesai tetap **1/6 (16,7%)**; sesudah Batch 2.3 lulus menjadi **2/6 (33,3%)**, dengan Fase 3–6 tersisa. Angka ini menghitung tonggak fase, bukan bobot pekerjaan atau tingkat kerapian seluruh codebase.
