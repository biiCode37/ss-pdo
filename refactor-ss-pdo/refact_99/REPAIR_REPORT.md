# Laporan Review Akhir — Fase 2, Batch 2.3

**Status:** `PASS` untuk pilot Batch 2.3. Ini review Codex; tidak ada perubahan kode aplikasi dalam `refact_99`.

## Implementasi yang diterima

`refact_98` memisahkan identitas callback `onClose` dari lifecycle registrasi stack, mengalokasikan z-index melalui efek layout, dan menguji dua pilot pada pembukaan bertahap serta serentak. Perbaikan portal stabil, reference counting scroll lock, fokus awal/pemulihan, dan Tab/Shift+Tab dari revisi sebelumnya tetap terjaga. Tidak ada perubahan pada logika domain atau perhitungan ritase.

## Before vs After

| Aspek | Sebelum revisi akhir | Setelah revisi akhir |
|---|---|---|
| Callback parent berubah | Modal bawah dapat terdaftar ulang dan naik ke puncak stack Escape. | Callback terbaru dipakai melalui ref; posisi registrasi modal yang tetap terbuka tidak bergeser. |
| Urutan visual/keyboard/Back | Queue dapat menjadi target Escape saat Report yang terlihat di depan. | Tes dua render membuktikan dialog di depan menjadi target Escape dan Back dalam kedua urutan pilot. |
| Kalkulasi z-index | Ref diakses saat render dan memunculkan `react(refs)`. | Alokasi dilakukan dalam efek layout; lint file inti bersih. |
| Lint target | 7 warning baru di `ModalShell` dan 4 warning lama di `historyNavigation`. | 0 warning baru di `ModalShell`; 4 warning lama tetap dicatat terpisah. |

## Case: Skenario Lapangan

1. **Antrean lalu laporan:** Petugas membuka Queue, dashboard merender ulang, kemudian membuka Report. Report berada di depan. Escape atau Back menutup Report sekali; Queue tetap aktif. Tes integrasi dua render membuktikannya.
2. **Laporan lalu antrean:** Report terbuka lebih dulu, Queue dibuka setelahnya. Queue mendapat z-index di atas Report dan menjadi target Escape/Back pertama; Report tetap terbuka sampai aksi kedua.
3. **Dashboard memperbarui data saat modal aktif:** Callback parent berubah berkali-kali tanpa tindakan buka/tutup modal. Stack tetap pada urutan visual yang sama dan callback terbaru dipanggil saat Escape.
4. **Draf laporan sementara ditutup:** Portal Report tetap stabil dan `keepMounted` menjaga node input/state anak; scroll lock dilepas saat tertutup dan dipasang lagi saat dibuka.
5. **Serah terima kualitas:** Owner melihat angka lint yang tepat: file inti revisi bersih, sementara empat warning `historyNavigation` dan warning root lainnya tetap dilacak. Visual peranti fisik belum diverifikasi.

## Verifikasi Codex

- Branch aktif: `devmode`.
- `pnpm run test src/`: **83 file, 586 tes lulus**, exit 0. Perintah ini juga mencocokkan dua file di `.worktrees/.../src/`; angka tersebut bukan khusus checkout utama.
- `pnpm run build`: TypeScript dan Vite build **lulus**, exit 0.
- `pnpm run lint src/components/ui/ModalShell.tsx src/utils/modalStackCoordinator.ts src/components/dashboard/QueueReportIntegration.test.tsx`: **0 warning, 0 error**, exit 0.
- `git diff --check`: exit 0; keluaran hanya peringatan konversi LF/CRLF.
- Bukti Gemini `refact_98/evidence/targeted-tests.txt`: 6 file/36 tes lulus. Bukti targeted lint: 4 warning lama di `historyNavigation.ts`, 0 error.
- Graphify dilaporkan telah diperbarui di `refact_98`; review ini tidak mengubah kode sehingga tidak menjalankan Graphify ulang.
- Pemeriksaan visual Light/Dark pada perangkat fisik belum dilakukan. Klaim kelas Tailwind pada `refact_98` tidak sesuai kode aktual; Queue/Report memakai CSS variables dan inline style.

## Keputusan fase

Fase 1 telah selesai; ketiga batch Fase 2 kini **PASS**, sehingga Fase 2 ditutup untuk cakupan yang direncanakan. Roadmap memiliki 6 fase: **2/6 fase selesai (33,3% menurut jumlah fase)**; **4 fase tersisa** (Fase 3–6). Persentase ini bukan estimasi bobot pekerjaan atau ukuran kerapian keseluruhan codebase. R80-10 global dan R89-01 tetap menjadi catatan terbuka untuk fase berikutnya.
