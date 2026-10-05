# Audit Codex — Revisi Fase 3 Batch 3.5 (`refact_125`)

Tanggal: 29 September 2026  
Branch: `devmode`  
Keputusan: **REVISION_REQUIRED**

## R126-01 — Riwayat modal bawah hilang setelah Back nyata berulang

- **Lokasi kode:** `src/utils/historyNavigation.ts:52-69` (`handlePopState`), `src/utils/historyNavigation.ts:131-146` (`removeBackNavigation`); tes terkait `src/components/busCard/BusInputModal.test.tsx:990-1158`.
- **Keparahan:** Tinggi untuk navigasi mobile bertumpuk.
- **Deskripsi:** Guard `isDismissing` berhasil mencegah pemanggilan `onBack` modal bawah selama modal atas masih terpasang. Namun pada Back pertama yang nyata, browser berpindah dari state modal atas ke state modal Bus; kode tidak menambahkan kembali state modal atas. Back kedua bergerak dari modal Bus ke root, lalu cabang `isDismissing` menambahkan state modal atas. Ketika modal atas unmount, `removeBackNavigation` memanggil `history.back()` dan browser kembali ke root. Modal Bus masih terbuka tetapi `history.state` sudah root, sehingga Back berikutnya tidak lagi memiliki riwayat modal Bus yang benar.
- **Dampak user:** Setelah double-tap Back pada dua modal bertumpuk, form Bus bisa tetap tampil sementara riwayat browser sudah mencapai root. Back berikutnya dapat menavigasi keluar atau memicu alur yang salah menurut browser/WebView, berisiko kehilangan draft.
- **Bukti:** Tes baru memakai `window.dispatchEvent(new PopStateEvent('popstate'))`, yang tidak menjalankan perubahan riwayat browser. Reproduksi `history.back()` nyata pada Happy DOM menghasilkan: `top -> bus -> rootGuard -> push(top) -> cleanup history.back() -> rootGuard`; panjang riwayat 4 menjadi 3. Lihat `evidence/history-state-repro.txt`.
- **Mitigasi:** Sinkronkan guard saat **Back pertama** dan Back tambahan dengan state riwayat yang benar. Setelah modal atas benar-benar hilang, state aktif harus kembali ke modal Bus yang masih terbuka; setelah Bus hilang, kembali ke root guard. Uji dengan pemanggilan `history.back()` nyata dan tunggu `popstate`, bukan hanya dispatch event sintetis. Jaga pencegahan Back ganda dan perilaku UI close, SweetAlert2, serta modal lain.
- **Status:** OPEN; menahan kelulusan Batch 3.5.

## Status temuan sebelumnya

| ID | Lokasi | Keparahan | Deskripsi/dampak awal | Mitigasi terverifikasi | Status |
| --- | --- | --- | --- | --- | --- |
| R124-01 | `historyNavigation.ts`, `BusInputModal.tsx` | Sedang | Back kedua dalam 220 ms dapat memanggil modal bawah/root. | `isDismissing` menahan callback modal bawah pada event sintetis, tetapi sinkronisasi riwayat nyata masih gagal sebagai R126-01. | PARTIAL |
| R124-02 | `refact_123` dan errata `refact_125` | Rendah | Klaim SweetAlert2 dan metode hitung baris ambigu. | Errata memisahkan stack SweetAlert2 serta menjelaskan baris fisik/tidak kosong. Hitungan source diverifikasi: Bus Input 368/346, tes 1298/1107, historyNavigation 170/145. | CLOSED |

## Gerbang independen

- `vitest run src/`: **88 berkas, 671 tes lulus**, exit 0. Diagnostik Happy DOM pada pemuatan Google API tidak menyebabkan tes gagal.
- `tsc -b`: exit 0.
- `vite build`: exit 0 dan PWA dihasilkan; peringatan chunk >500 kB tidak terkait revisi.
- `oxlint` pada Bus Input, tes, historyNavigation, dan tesnya: exit 0.
- Verifikasi perangkat fisik dan tampilan mobile nyata belum dilakukan pada review ini.

Fase 3 tetap **4/5 batch PASS** sampai R126-01 diselesaikan dan diaudit ulang. R80-10 global tetap PARTIAL.
