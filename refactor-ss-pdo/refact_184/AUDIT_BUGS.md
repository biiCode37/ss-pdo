# Audit Temuan Bug (Refactor 184)

## Ringkasan Eksekutif

Audit mendalam ini diinisiasi setelah pengujian nyata antarmuka modul **Plotting Harian** dan **Smart Ritase** pada peranti seluler (smartphone) dengan rute aktif **JAK.115 TERM. TANJUNG PRIOK - PEGANGSAAN II IGI**. Berdasarkan evaluasi tangkapan layar lapangan dan masukan pengguna, ditemukan sejumlah bug kritis dan kecacatan desain (FE & BE):
1. **Titik Pengendapan Kembar ("IGI" & "IGI"):** Kedua pangkalan start diekstrak menjadi nama yang sama, menghilangkan titik "Priok".
2. **Preset Ritase Statis & Kaku:** Target ritase terkunci pada 6 opsi statis (6.0 - 8.5 Rit) dan modal input bus mengunci preset ke 4 tombol hardcoded, mencegah pengisian ritase bebas sesuai ketentuan masing-masing rute.
3. **Duplikasi Nomor Urutan (#1 ganda, #2 ganda):** Pemindahan pangkalan unit tidak mereindeks urutan, menyebabkan nomor antrean duplikat.
4. **Layout Grid Header Ambruk:** Kotak metrik ke-5 terlempar sendirian ke baris kedua karena grid 4-kolom yang kaku.
5. **Tabrakan Bar Multi-Select & Bottom Dock:** Floating bar multi-select menabrak dan menutupi bilah navigasi bawah aplikasi.
6. **Kartu Unit Terhimpit Horizontal:** 7 elemen dipaksakan dalam 1 baris flexbox horizontal sehingga teks unit terpotong/terlipat dua baris.
7. **Multi-Select Mengacak Unit Non-Terpilih:** Tombol tetapkan titik start mereset pangkalan seluruh unit lain yang tidak dipilih.

---

## Tabel Temuan & Keparahan Bug

| ID Temuan | Lokasi Kode | Keparahan | Deskripsi Singkat | Dampak Pengguna | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-184-01** | `src/utils/routeEndpointUtils.ts` | 🔴 **CRITICAL** | Nama kedua titik pengendapan diekstrak identik menjadi "IGI" & "IGI" karena parsing tidak memecah delimiter rute ` - ` dan spreadsheet menggunakan `"TJ PRIOK"` tanpa titik | Pengawas tidak dapat membedakan pangkalan armada Priok vs IGI; seluruh UI menampilkan "Start IGI" ganda | Pisahkan string directional `[ORIGIN] - [DESTINATION]` dengan regex delimiter `\s*[-–—/]\s*`, tambahkan normalisasi `"TJ PRIOK"`, dan gunakan fallback dari `matchedRoute.route_name` |
| **BUG-184-02** | `src/components/plotting/PlottingUnitCard.tsx`<br>`src/components/busCard/modal/BusInputModalTrip.tsx`<br>`src/components/busCard/modal/singleFocus/SingleFocusTrip.tsx` | 🔴 **CRITICAL** | Target ritase dikunci statis pada opsi dropdown `[6, 6.5, 7, 7.5, 8, 8.5]` dan 4 preset hardcoded di modal input trip | Petugas tidak dapat menginput target ritase di luar opsi tersebut (misal rute target 4, 5, 9, 10, atau nilai khusus) | Ganti dropdown statis dengan kontrol input fleksibel (custom number input + stepper ±0.5 + quick chips), sediakan fitur "Target Default Rute" di header plotting, dan gunakan target dinamis di modal trip |
| **BUG-184-03** | `src/components/plotting/DailyPlottingPage.tsx` | 🟠 **HIGH** | Nomor urutan (#1, #2) muncul duplikat pada pangkalan yang sama saat unit berpindah titik start | Terjadi bentrok nomor dispatch armada di lapangan (dua unit mengaku urutan #1) | Terapkan normalisasi urutan ketat (`normalizeBaseOrders`): setiap mutasi wajib mereindeks pangkalan A dan B menjadi urutan bulat tanpa celah: `1..N` |
| **BUG-184-04** | `src/components/plotting/PlottingHeader.tsx` | 🟡 **MEDIUM** | Stat box ke-5 ("IGI 13") terlempar ke baris kedua karena `gridTemplateColumns: repeat(4, 1fr)` | Tampilan header berantakan dan asimetris pada layar ponsel | Tata ulang header menjadi 3 metrik esensial (Total, Siap, Kendala), pindahkan informasi pangkalan ke Base Tabs di bawahnya, dan tambahkan kontrol Target Default Rute |
| **BUG-184-05** | `src/components/plotting/DailyPlottingPage.tsx` | 🟡 **MEDIUM** | Bar floating multi-select (`bottom: 72px`) bertabrakan dan menutupi bilah `BottomNav` | Teks tombol tertutup, sulit di-tap oleh pengguna | Naikkan posisi bar multi-select di atas `BottomNav` (`bottom: calc(82px + env(safe-area-inset-bottom, 0px))`) dan tambahkan bottom padding kontainer `140px` |
| **BUG-184-06** | `src/components/plotting/PlottingUnitCard.tsx` | 🟡 **MEDIUM** | 7 elemen interaktif dipaksakan dalam satu baris horizontal sehingga nomor unit melipat menjadi dua baris | Tampilan sesak, tombol sulit ditekan dengan jempol pengguna operasional di lapangan | Rombak tata letak kartu menjadi 2 baris proporsional: Baris 1 untuk identitas (Urutan, Unit, Pangkalan, Reorder) dan Baris 2 untuk kontrol operasional (Target Ritase & Status) |
| **BUG-184-07** | `src/components/plotting/DailyPlottingPage.tsx` | 🟠 **HIGH** | `handleAssignStartPoint` secara agresif mengubah pangkalan seluruh unit lain yang tidak terpilih | Mengacak-acak pembagian pangkalan yang sudah diatur sebelumnya | Ubah logika multi-select: HANYA ubah pangkalan unit-unit yang dipilih oleh pengguna, biarkan unit lain tetap pada pangkalannya |
