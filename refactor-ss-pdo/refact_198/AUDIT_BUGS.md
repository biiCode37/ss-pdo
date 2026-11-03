# AUDIT TEMUAN INTERAKSI & ERGONOMI: REFACTOR 198
**Modul:** Plotting Armada Harian (`src/components/plotting/`)  
**Fokus Masalah:** Kebisingan Visual Seleksi Kartu, Kelelahan Interaksi Reorder Jarak Jauh, Ketiadaan Reorder Rombongan

---

### ID Temuan: BUG-PLOTTING-198-01
- **Lokasi Kode:** `src/components/plotting/PlottingUnitCard.tsx`
- **Keparahan:** Medium (Visual Noise & Ruang Terbuang)
- **Deskripsi:** Keberadaan bulatan checklist `○` abu-abu pada setiap kartu dalam kondisi normal (tidak terpilih) menimbulkan kebisingan visual yang tidak perlu dan memakan lebar horizontal kartu ~24px. Padahal kartu yang terpilih sudah memiliki border neon (`1.5px solid #38bdf8`) dan tinted background highlight.
- **Dampak User:** Tampilan kartu unit terkesan penuh sesak oleh tombol checklist idle yang tidak memberikan nilai informasi saat belum dipilih.
- **Mitigasi:** Menghapus lingkaran checkbox idle total. Seluruh bodi kartu dapat disentuh untuk memilih unit (*tap card to select*). Saat terpilih, border neon menyala disertai **centang mini halus (*conditional checkmark*)** di samping nomor urut sebagai konfirmasi ganda visual yang bersih.

---

### ID Temuan: BUG-PLOTTING-198-02
- **Lokasi Kode:** `src/components/plotting/PlottingUnitCard.tsx`, `DailyPlottingPage.tsx`
- **Keparahan:** High (Kelelahan Interaksi / Repetitive Tap Strain)
- **Deskripsi:** Pengaturan urutan armada sebelumnya hanya menyediakan tombol panah naik `[↑]` dan turun `[↓]` per 1 tingkat. Jika pengawas di subuh hari ingin memindahkan unit urutan #14 ke urutan #2, pengawas harus menekan tombol panah 12 kali secara berulang. Ini menimbulkan kelelahan jempol dan risiko salah hitung nomor urut.
- **Dampak User:** Pengawas lapangan merasa frustrasi dan lambat saat menyusun giliran armada subuh hari.
- **Mitigasi:** Mengubah badge nomor urut `[ # ]` menjadi elemen interaktif yang ketika diklik membuka **`PlottingOrderModal`** (Lembar Cepat Penempatan Relatif). Modal menyediakan opsi 1-ketuk `[ ⤒ Paling Depan (#1) ]`, `[ ⤓ Paling Belakang ]`, serta penempatan relatif (`Di Atas Unit` atau `Di Bawah Unit`) terhadap unit acuan target.

---

### ID Temuan: BUG-PLOTTING-198-03
- **Lokasi Kode:** `src/components/plotting/DailyPlottingPage.tsx`
- **Keparahan:** High (Ketiadaan Fitur Operasional / Missing Capability)
- **Deskripsi:** Tidak ada mekanisme untuk memindahkan beberapa unit bus sekaligus (*Multi-Unit Reorder*). Pengawas terpaksa memindahkan bus satu per satu.
- **Dampak User:** Membutuhkan waktu yang lama saat ingin menggeser sekelompok armada cadangan atau giliran jadwal secara rombongan.
- **Mitigasi:** Menambahkan tombol aksi `[ ⇅ Atur Posisi (N) ]` pada Floating Action Bar saat $\ge 2$ unit terpilih. Mengimplementasikan logika *Preserve Relative Order* (mempertahankan urutan relatif antar unit di dalam rombongan saat disisipkan ke posisi baru) serta *Smart Exclusion Guard* (mengecualikan unit-unit yang terpilih dari dropdown unit acuan).
