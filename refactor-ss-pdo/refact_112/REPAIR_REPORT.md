# Laporan Review Codex — Fase 3 Batch 3.2 Final

**Status:** `PASS / BATCH_3_3_OPEN`  
**Branch:** `devmode`  
**Pelaksana revisi kode:** Gemini; Codex melakukan review dan verifikasi independen. Tidak ada perubahan kode aplikasi pada review ini.

## Implementasi yang diterima

`handleApplyRollover` pada `useBusInputForm.ts` kini memperoleh pesan lintas hari aktif sebelum odometer diubah, menerapkan rollover, kemudian menghapus hanya pesan itu melalui kecocokan tepat. `handleFormSubmit` membersihkan state error setelah validasi sukses. Errata klaim laporan lama sudah tercatat di `refact_111`.

## Before vs After

| Aspek | Sebelum revisi (`refact_110`) | Setelah revisi (`refact_111`) |
|---|---|---|
| Pembersihan error rollover | Filter fragmen umum menghapus pesan lintas hari sekaligus KM pair. | Hanya pesan lintas hari aktif yang dihapus dengan kecocokan tepat. |
| Error lain | KM pair dan TOA bisa hilang dari tampilan padahal masih salah. | Tes membuktikan keduanya tetap ada dan submit dengan nilai salah ditolak. |
| State sesudah submit valid | Error lama dapat tertinggal. | `validationErrors` dibersihkan ketika validasi sukses. |
| Pesan KM pair sesudah rollover | Tidak terlihat karena ikut terhapus. | Terlihat, tetapi angka KM Awal dalam pesan masih nilai sebelum rollover; dicatat sebagai R112-01 untuk Batch 3.3. |

## Case: Skenario Lapangan

Petugas memasukkan KM Awal Shift 1 `292003` dan KM Akhir `291900`, dengan KM akhir H-1 `292990`. Submit menampilkan error lintas hari dan error KM pair. Setelah petugas menerima saran rollover, KM Awal menjadi `293003`. Pesan lintas hari hilang, pesan KM pair tetap muncul, dan penyimpanan tetap ditolak hingga KM Akhir diperbaiki. Pada tampilan sesaat setelah rollover, angka KM Awal dalam pesan KM pair masih `292003`; Batch 3.3 akan menyegarkan pesan dari state baru.

Kasus kedua: jika TOA Shift 1 `-5` bersamaan dengan error lintas hari, menerima rollover hanya menghapus error lintas hari. Error TOA tetap tampil sampai nilainya diperbaiki.

## Verifikasi dan keputusan

- Codex menjalankan `pnpm run test` secara independen: **84 file / 622 tes lulus**.
- Codex menjalankan `pnpm run build` secara independen: **lulus**.
- Lint terarah independen: **lulus**.
- Bukti Gemini tersedia di `refact_111/evidence/`; review memastikan perilaku penting pada kode dan tes form.
- Batch 3.2 **PASS**. Dari lima batch Fase 3, **dua selesai** (3.1 dan 3.2); berikutnya Batch 3.3. Status ini bukan klaim seluruh proyek sudah selesai.

Instruksi executor berikutnya: `GEMINI_PHASE_03_BATCH_03.md` dalam folder ini.
