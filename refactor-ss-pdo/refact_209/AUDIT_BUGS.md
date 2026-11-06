# AUDIT TEMUAN STATUS KARTU UNIT & TARGET RITASE: REFACTOR 209
**Modul:** Kartu unit Input SS (`BusCard`, `BusCardSummary`), kartu & detail Armada (`UnitCard`, `UnitDetailModal`, `UnitSummaryDashboard`), klasifikasi keterangan (`keteranganUtils`), token warna
**Fokus Masalah:** Penanda visual unit bermasalah memakai target ritase per rute yang tidak sesuai pola lapangan; keterangan unit (penanda sebenarnya di sheet) belum dimanfaatkan secara konsisten.
**Spec/Rencana:** `docs/superpowers/specs/2026-11-07-unit-card-keterangan-status-design.md`, `docs/superpowers/plans/2026-11-07-unit-card-keterangan-status.md`

---

### ID Temuan: BUG-UI-209-01
- **Lokasi Kode:** `src/components/busCard/BusCardSummary.tsx`, `src/components/busCard/busCardStyles.ts`, `src/components/UnitCard.tsx`, `src/components/UnitDetailModal.tsx`, `src/utils/unitAnalytics.ts` (`evaluateTripStatus`)
- **Keparahan:** Medium (indikator menyesatkan)
- **Deskripsi:** Warna ritase dibandingkan dengan "target rute" hasil tebakan (`detectTargetTrip` = pola trip terbanyak / angka Set Jumlah Trip di memori). Analisis tab 1–5 sheet 18 rute November membuktikan ritase **bergilir per slot keberangkatan setiap hari** (JAK.89 pola 10/10 → 9/9 → 8/9 bergeser 1 baris/hari; JAK.05 unit sama 6/6 ↔ 7/7), sehingga satu target per rute selalu salah sebagian.
- **Dampak User:** Unit normal tampil kuning ⚠️ "kurang", unit bermasalah tidak menonjol; pemilik memutuskan target ritase tidak dipakai agar tidak menambah beban petugas.
- **Mitigasi:** Semua angka ritase satu warna netral; hapus perbandingan target, ⚠️, kelas `status-warning/achieved`, tooltip target, dan `evaluateTripStatus`.

### ID Temuan: BUG-UI-209-02
- **Lokasi Kode:** `src/components/busCard/BusCard.tsx` (badge OFF/T.O & `bus-card-non-sgo` berbasis `activeShiftStatus`), `src/components/UnitCard.tsx`
- **Keparahan:** Medium (riwayat masalah hilang antar shift)
- **Deskripsi:** Badge & latar abu-abu kartu hanya mengikuti keterangan **shift aktif**; unit "S1: OFF" tampil normal di shift 2. Unit berketerangan kendala (BA02, NP, Service, Sakit) — yang di sheet hampir selalu kurang ritase — tidak diberi penanda di kepala kartu sama sekali.
- **Dampak User:** Petugas shift berikutnya mengira unit baik-baik saja; unit berkendala tidak terlihat sekilas.
- **Mitigasi:** `classifyUnitKeterangan` menilai keterangan **sepanjang hari** (S1+S2) → TO (merah) / KENDALA (oranye) / OFF_LIBUR (kuning) dengan prioritas TO > KENDALA > OFF_LIBUR; badge kategori + latar & garis tepi kartu; strip keterangan tampil bila berprefiks shift.

### ID Temuan: BUG-DATA-209-03
- **Lokasi Kode:** `src/utils/keteranganUtils.ts` (`isUnitOff`) → dipakai `useBulkOperations.ts` (Set Jumlah Trip / Set Trip Terpilih)
- **Keparahan:** High (data trip salah tertulis ke SS)
- **Deskripsi:** `isUnitOff` hanya mengenali kata "OFF". Banyak rute menulis "LIBUR"/"Libur" (JAK.01, 110A, 113, 117, 118, 15, 87, 88). **Set Jumlah Trip mengisi trip ke unit LIBUR.**
- **Dampak User:** Unit libur tercatat punya trip di SS setelah Set Jumlah Trip.
- **Mitigasi:** `isUnitOff` mengenali kata utuh `OFF` atau `LIBUR` (`/\b(?:OFF|LIBUR)\b/i`, "LIBURAN" tidak cocok); `hasMeaningfulNote` menganggap "LIBUR" status murni.
- **Koreksi klaim:** Saat desain disebut LIBUR juga ikut dihitung di bar progres. Pembuktian (test dijalankan terhadap regex lama) menunjukkan **tidak**: `isUnitAllowedForInput` sudah mengecualikan unit yang berketerangan di kedua shift. Test progres tetap dipertahankan sebagai pengaman regresi.

### ID Temuan: BUG-UI-209-04
- **Lokasi Kode:** `src/components/UnitCard.tsx` (kolom Ritase), `TEXT_DASHBOARD.BUS_CARD_ACTIONS.TRIP_BADGE_NORMAL`
- **Keparahan:** Low (pelanggaran standar terminologi AGENTS.md)
- **Deskripsi:** Kartu Armada menampilkan trip mentah "8/7" berlabel "Rit"; badge mode fokus trip menulis "8/7 Rit".
- **Dampak User:** Trip satu arah terbaca sebagai ritase.
- **Mitigasi:** Kartu Armada menampilkan ritase PP `(pergi + pulang) / 2` ("7.5 rit"); badge trip menjadi "Trip: 8/7".

### ID Temuan: BUG-UI-209-05
- **Lokasi Kode:** `src/components/FormattedNoteText.tsx`
- **Keparahan:** Low (informasi shift hilang)
- **Deskripsi:** "S1: OFF" dirender menjadi badge "OFF" saja — prefiks shift dibuang (ditemukan saat test Task 4 gagal).
- **Dampak User:** Strip keterangan tidak menjelaskan shift mana yang bermasalah, padahal warna kartu kini berlaku sepanjang hari.
- **Mitigasi:** Prefiks `S1`/`S2` dipertahankan sebagai label kecil sebelum isi keterangan.
