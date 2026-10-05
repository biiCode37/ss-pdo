# Audit review Fase 1 Gemini — Refact 81

Tanggal: 27 September 2026. Reviewer: Codex (orchestrator). Branch: `devmode`.

Ruang lingkup: `refact_80` dibandingkan dengan `GEMINI_PHASE_01.md`, sumber aplikasi yang aktif, dan baseline `refact_79`. **Keputusan review: REVISE.** Semua temuan di bawah berkaitan dengan akurasi hasil audit/rencana implementasi; kode aplikasi belum diubah pada Fase 1. Koreksi harus dicatat pada folder urutan baru, tanpa mengubah arsip `refact_80`.

## R81-01 — Klasifikasi inventory menyatakan implementasi sebagai facade

- **Lokasi:** `refact_80/COMPONENT_INVENTORY.csv`, kolom `Peran`, `Tanggung Jawab`, dan `Keputusan`.
- **Keparahan:** Tinggi untuk kualitas keputusan refactor.
- **Deskripsi:** jumlah path lengkap dan unik: 167 dari 167 file komponen non-test yang dihitung ulang. Namun 12 dari 23 baris berlabel `Facade Re-export` memiliki fungsi/komponen lokal: `AnalyticsDashboard`, `BottomNav`, `CompletionStatusCard`, `Dashboard`, `FormattedNoteText`, `KPICard`, `ShiftComparisonCard`, `Skeletons`, `SwipeableContainer`, `UnitCard`, `UnitDetailModal`, dan `UnitSummaryDashboard`. Sebaliknya, facade `AllRouteMonitoringPage`, `LoginScreen`, dan `UserManagementPage` diberi peran `Page / Orchestrator`. Contoh konkret: `src/components/AnalyticsDashboard.tsx:1` mengimpor helper dan komponen, lalu mendefinisikan `AnalyticsDashboardComponent`; `src/components/AllRouteMonitoringPage.tsx:1` hanya re-export.
- **Dampak user:** rencana menghapus atau mengalihkan facade dapat mengenai implementasi aktif; prioritas modul dan batas tanggung jawab menjadi keliru. Ini kesalahan dokumen, belum bukti regresi aplikasi.
- **Mitigasi:** validasi isi setiap file, terutama seluruh root `src/components/*.tsx`; perbaiki klasifikasi dan alasan keputusan pada inventory versi baru. Pastikan `Tanggung Jawab`, `Pemanggil`, dan `Test Relevan` berisi fakta spesifik atau `None` dengan alasan, tanpa label generik yang menyamarkan fungsi.

## R81-02 — Rencana ritase menambahkan pembulatan yang tidak perlu

- **Lokasi:** `refact_80/AUDIT_BUGS.md` bagian R79-05 dan `refact_80/IMPLEMENTATION_BATCHES.md` Batch 2.1.
- **Keparahan:** Tinggi karena menyentuh integritas angka domain.
- **Deskripsi:** dua dokumen mengusulkan `Number((route.totalTrips / 2).toFixed(1))`. `RegionalRouteItem.totalTrips` bertipe `number` (`src/services/allRouteMonitoringService.ts:51`) dan aturan `.agents/AGENTS.md` melarang pembulatan sepihak nilai spreadsheet. Pada trip integer, `/ 2` sudah eksak ke kelipatan 0,5. Jika sumber berisi pecahan, contoh 100,25 trip, formula usulan mengubah 50,125 menjadi 50,1.
- **Dampak user:** koreksi bug 101 trip dapat sekaligus memperkenalkan perubahan nilai pada data lain.
- **Mitigasi:** spesifikasi fallback cukup `route.totalTrips / 2` dengan prioritas `totalRitasePp` eksplisit. Pisahkan formatting tampilan dari angka domain, sesuai aturan presisi proyek. Kasus uji 101, 100, 0, dan sumber eksplisit tetap wajib; tambahkan input pecahan hanya jika sesuai kontrak data nyata.

## R81-03 — Contoh rollback dapat menghapus perubahan lokal

- **Lokasi:** `refact_80/IMPLEMENTATION_BATCHES.md`, Batch 2.1 dan 2.2.
- **Keparahan:** Tinggi untuk keselamatan working tree.
- **Deskripsi:** langkah `git checkout -- ...` dan `rm -rf src/components/busCard/modal/fields/` diberikan sebagai prosedur pemulihan. Working tree `devmode` sudah memiliki perubahan lokal milik owner. Perintah pemulihan seperti itu dapat membuang edit yang belum dicatat bila file yang disentuh bertumpang tindih; `rm -rf` juga tidak sesuai kehati-hatian shell Windows pada workspace ini.
- **Dampak user:** kehilangan pekerjaan lokal atau penghapusan file yang dibuat batch lain.
- **Mitigasi:** hapus contoh perintah tersebut. Rekam status/diff sebelum batch, batasi file tugas, lalu pulihkan hanya hunks yang dibuat batch setelah dibandingkan dengan snapshot kerja sebelumnya. Jika perubahan lain bertumpuk, dokumentasikan konflik dan lakukan patch terarah.

## R81-04 — Klaim bug modal bertumpuk melampaui bukti alur aktual

- **Lokasi:** `refact_80/AUDIT_BUGS.md` R80-10, `UI_CONTRACTS.md` bagian modal, dan `REPAIR_REPORT.md` Skenario 3.
- **Keparahan:** Sedang.
- **Deskripsi:** cleanup `document.body.style.overflow = ""` pada `src/components/busCard/BusInputModal.tsx:77` dan `src/components/dashboard/QueueModal.tsx:41` memang berisiko saat dua modal aktif. Namun laporan menyatakan skenario petugas membuka QueueModal *dari dalam* BusInputModal sebagai kejadian aktual tanpa jalur pembuka itu pada `BusInputModal.tsx`; QueueModal dibuka lewat state Dashboard (`Dashboard.tsx:270`, `DashboardModals.tsx:155`). Laporan belum menunjukkan tes atau reproduksi overlap yang membuktikan dampak lapangan. Spesifikasi `prevOverflow` per-modal juga belum cukup untuk urutan tutup terbalik: A buka, B buka, A tutup lebih dulu, maka A dapat mengembalikan overflow awal sementara B masih terbuka.
- **Dampak user:** executor dapat membangun shell besar atas skenario yang belum dibuktikan dan menganggap solusi penguncian sudah aman padahal belum.
- **Mitigasi:** nyatakan risiko kode sebagai **confirmed conditional**, dampak UI sebagai **unverified** sampai ada jalur/reproduksi. Telusuri semua pembuka modal dan urutan tutup. Bila kebutuhan bersama terbukti, rancang penguncian terkoordinasi serta tes kedua urutan penutupan sebelum migrasi konsumen.

## R81-05 — Kontrak UI merujuk token dan konsumen yang tidak sesuai

- **Lokasi:** `refact_80/UI_CONTRACTS.md` prinsip tema dan `IMPLEMENTATION_BATCHES.md` Batch 2.2.
- **Keparahan:** Sedang.
- **Deskripsi:** kontrak tema menyebut `var(--bg-main)`, tetapi tidak ada definisi token itu di `src/`; token global yang ada adalah `--bg-color` dan `--card-bg` di `src/index.css:3`. Batch 2.2 memasukkan `StatusChoiceChip` untuk status armada SGO/AP/AC ke pilot form bus Shift 1/2. Chip yang nyata pada Shift 1/2 mengendalikan `Manual` dan `Keterangan` (`BusInputModalShift1.tsx:397`, `BusInputModalShift2.tsx:399`). Status armada adalah domain fitur lain.
- **Dampak user:** warna komponen baru dapat tidak terdefinisi; primitive spekulatif menambah file tanpa konsumen yang tepat.
- **Mitigasi:** gunakan nama token yang ada atau proposal penambahan yang eksplisit; pilot cukup pada field/gaya input Shift 1/2 yang benar-benar sama. Jika chip Manual/Keterangan disatukan, beri nama netral dan bukti dua konsumen. Tunda komponen status armada sampai fitur armada diaudit sebagai batchnya sendiri.

## R81-06 — Beberapa dampak dinyatakan pasti tanpa pengukuran

- **Lokasi:** `refact_80/AUDIT_BUGS.md` R79-01/R79-04 dan `REPAIR_REPORT.md` klaim “tervalidasi 100%”.
- **Keparahan:** Rendah untuk ketepatan laporan.
- **Deskripsi:** laporan menyatakan penurunan responsivitas ketikan pada ponsel rendah dan ukuran CSS tunggal memperlambat rendering awal, tetapi tidak menyertakan profil runtime atau ukuran parse/render yang membuktikan dampak itu. Pernyataan “satu-satunya lokasi” hanya didukung pencarian pola terbatas.
- **Dampak user:** prioritas dapat terdorong oleh dampak yang belum terukur.
- **Mitigasi:** tandai konsekuensi tersebut sebagai risiko/perkiraan. Klaim eksklusif harus menyebut ruang lingkup pencarian yang tepat. Fokus pada duplikasi/tanggung jawab dan bug ritase yang benar-benar terlihat dari kode.

## Hal yang diterima dari Fase 1

- 167 path inventory cocok dengan enumerasi terbaru dan tidak ada duplikat path.
- Dokumentasi wajib `AUDIT_BUGS.md` dan `REPAIR_REPORT.md`, Before vs After, serta Case: Skenario Lapangan tersedia.
- Baseline Gemini menunjukkan lint exit 0, 74 file / 524 test lulus, build exit 0. Hash 319 file baseline Codex tetap sama setelah audit Gemini; tidak ada edit source dari batch ini.
- R79-05 pada kode memang salah: 101 trip fallback menjadi 51 ritase PP. Koreksi domain tetap prioritas berikutnya setelah spesifikasi dibetulkan.
