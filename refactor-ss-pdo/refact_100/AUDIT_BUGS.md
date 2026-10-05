# Audit Awal Fase 3 — Form Input Bus dan Odometer

**Status:** `PHASE_03_STARTED / BATCH_3_1_READY`. Audit dilakukan pada branch `devmode` tanpa mengubah kode aplikasi. Baseline mandiri: 5 file tes terkait, **62 tes lulus**; lint tiga hotspot menghasilkan **4 warning `react-hooks(exhaustive-deps)`** dan 0 error. Arsip `refact_1`–`refact_99` tidak diubah.

## R100-01 — Mutasi langsung dan penghapusan semua error saat bypass odometer

- **Lokasi kode:** `src/components/busCard/BusInputModal.tsx:256-280`; state di `src/components/busCard/modal/useBusInputForm.ts:351-352`.
- **Keparahan:** Sedang.
- **Deskripsi:** Handler checkbox mengubah `form.validationErrors.length = 0` setelah mengaktifkan bypass. Ini memutasi array state React langsung dan menghapus pula pesan validasi lain yang tidak terkait reset odometer.
- **Dampak user:** Form terlihat bebas error meski mungkin masih ada kesalahan TOA atau KM lain. Tombol simpan dapat tampak aktif lalu validasi muncul kembali pada submit; pengalaman petugas membingungkan.
- **Mitigasi:** Pindahkan perubahan bypass/error ke aksi state di hook. Hilangkan hanya error lintas hari yang memang dibypass, pertahankan error lain, dan uji perubahan UI serta validasi submit. Jangan menulis ke properti array state.

## R100-02 — Aturan odometer bercampur di hook form 989 baris

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:96-225,272-331,462-560,569-606,608-989`.
- **Keparahan:** Sedang, risiko pemeliharaan/regresi.
- **Deskripsi:** State KM empat field, prefill tiga digit, lock lintas shift, saran rollover, sanitasi payload, fokus, validasi, dan penyimpanan berada di satu hook. `busModalOdometer.ts` dan `busModalValidation.ts` sudah menyediakan helper murni, namun sanitasi KM masih didefinisikan lokal di hook.
- **Dampak user:** Perubahan kecil pada alur KM dapat merusak skenario lain: bus hanya Shift 2, nilai prefill siluman tersimpan, atau saran rollover salah.
- **Mitigasi:** Batch 3.1 mengekstrak hanya helper sanitasi murni ke modul odometer yang sudah ada. Batch 3.2 memisahkan state/derivasi odometer ke sub-hook fokus; Batch 3.3 memisahkan validasi dan pembentukan payload. Pertahankan API return `useBusInputForm` sementara konsumen dimigrasikan bertahap.

## R100-03 — Efek prefill memiliki dependensi yang tidak lengkap

- **Lokasi kode:** `src/components/busCard/modal/useBusInputForm.ts:272-330`.
- **Keparahan:** Sedang.
- **Deskripsi:** Oxlint menemukan empat warning `react-hooks(exhaustive-deps)` pada efek yang membaca `kmAwal1`, `kmAkhir1`, `kmAkhir2`, dan `kmAwal2` tanpa memasukkannya dalam dependensi. Menambahkan dependensi secara membabi buta berisiko membuat loop atau menimpa input user.
- **Dampak user:** Saat referensi H-1 datang belakangan atau petugas mengoreksi KM, prefill/lock dapat terlambat, tidak konsisten, atau menimpa ketikan.
- **Mitigasi:** Karakterisasi alur async H-1 dan koreksi/backspace dalam tes; saat Batch 3.2 mengekstrak sub-hook, susun ulang efek dengan dependensi lengkap dan guard yang menjaga input user. Lint harus bersih tanpa menonaktifkan rule.

## R100-04 — Komponen Single Focus 805 baris dan teks UI langsung

- **Lokasi kode:** `src/components/busCard/modal/BusInputModalSingleFocus.tsx:13-805`, terutama chip pada baris 142,149,228,235,387,394,649,656 dan label acuan pada 461,723; fallback trip di `src/components/busCard/BusInputModal.tsx:334-335`.
- **Keparahan:** Sedang, konsistensi UI/UX dan aturan kamus teks.
- **Deskripsi:** Satu komponen merender seluruh varian TOA/KM/catatan; beberapa label chip dan acuan masih literal dalam `.tsx`, walau kamus `TEXT_ALERTS.BUS_INPUT_MODAL` sudah punya sebagian padanan.
- **Dampak user:** Label yang sama dapat berbeda antara mode Single Focus dan Shift 1/2; perubahan copy atau terminologi mudah terlewat.
- **Mitigasi:** Batch 3.1 mengganti fallback trip pada file yang disentuh dengan kamus yang ada. Batch 3.4 memecah Single Focus menurut kelompok TOA, KM, dan catatan yang benar-benar dipakai, lalu memusatkan seluruh teks dan memperbarui `texts.test.ts`. Pertahankan DOM/ID/urutan fokus dan tampilan mobile.

## R100-05 — Scroll lock modal bus belum memakai koordinator

- **Lokasi kode:** `src/components/busCard/BusInputModal.tsx:59-79,96-358`.
- **Keparahan:** Sedang.
- **Deskripsi:** `BusInputModal` masih mengatur `document.body.style.overflow` langsung, listener Escape sendiri, dan portal sendiri. Ini adalah sisa R80-10 pada alur input bus, sementara `ModalShell` pilot telah diterima pada Fase 2.
- **Dampak user:** Bila dialog lain terbuka bertumpuk, penutupan modal bus dapat membuka scroll halaman terlalu dini atau urutan Escape/Back tidak konsisten.
- **Mitigasi:** Batch 3.5 migrasi terukur ke `ModalShell`/`scrollLockCoordinator`, mempertahankan keyboard viewport, animasi penutupan 220 ms, fokus, dan posisi footer. Status R80-10 global tetap PARTIAL hingga modal lain di luar Fase 3 diperiksa.

## Risiko integrasi yang harus dijaga

- `useBusInputForm.ts:904-905` memanggil `onSave(updates)` lalu `onDismiss()` tanpa menunggu Promise. Konsumen `useBusCardSave.ts` sengaja melakukan optimistic update, konflik tiga arah, dan antrean offline di latar belakang. Jangan mengubah urutan atau semantik ini pada refactor tanpa kontrak tes yang membuktikan perilaku baru aman.
- Terminologi: **1 ritase = PP = 2 trip**; tidak boleh menyimpan trip satu arah sebagai ritase atau membulatkan angka spreadsheet sembarangan.
- R89-01 `dist_old/` dan noise Graphify/lint root tetap OPEN; jangan dihapus dalam Fase 3.
