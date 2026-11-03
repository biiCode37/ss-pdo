# REPAIR REPORT: REFACTOR 198
**Modul:** Optimalisasi UI/UX Seleksi Kartu & Lembar Cepat Penempatan Urutan Relatif  
**Tanggal:** 03 November 2026  
**Status:** Terverifikasi 100% Lulus (Zero Regression)

---

## 1. Implementasi Perbaikan

### A. Clean Tap-to-Select & Conditional Checkmark (`PlottingUnitCard.tsx`)
- Menghapus bulatan checklist kosong `○` saat kartu dalam kondisi normal (idle).
- Menjadikan seluruh area bodi kartu (termasuk nomor armada) dapat disentuh langsung untuk memilih unit (*tap card to select*).
- Menampilkan centang mini halus (`CheckCircle2` 15px berwarna `var(--color-action-primary-bg, #38bdf8)`) hanya saat kartu berstatus terpilih (`isSelectedForMultiSelect === true`) berdampingan dengan border neon dan latar berpijar.
- Menghapus ikon titik seret `GripVertical` (`[::]`) di mobile guna mengeliminasi ambiguitas interaksi sentuh.

### B. Lembar Cepat Penempatan Urutan Relatif (`PlottingOrderModal.tsx`)
- Dibuat komponen modal mobile-first yang bersih dan mudah digunakan dengan jempol tangan:
  1. **Tombol Pintas 1-Ketuk:** `[ ⤒ Paling Depan (#1) ]` (TOP) dan `[ ⤓ Paling Belakang ]` (BOTTOM).
  2. **Penempatan Relatif Kontesktual:** Segmented toggle `[ Di Atas Unit ]` vs `[ Di Bawah Unit ]` (default).
  3. **Dropdown Unit Acuan Target:** Menampilkan format `#Urut • Nama Unit` dari armada di pangkalan yang sama.
  4. **Smart Exclusion Guard:** Mengecualikan unit-unit yang sedang dipindahkan dari daftar pilihan acuan.

### C. Penyelipan Rombongan Armada Multi-Unit (`plottingOrderUtils.ts` & `DailyPlottingPage.tsx`)
- Menambahkan algoritma murni `reorderUnitsRelative`:
  - Mendukung pemindahan 1 maupun banyak unit sekaligus (*multi-unit block shift*).
  - Menerapkan prinsip *Preserve Relative Order*: urutan relatif antar unit di dalam rombongan tetap terjaga saat diselipkan.
  - Menormalisasi ulang nomor urut seluruh unit pangkalan menjadi sequential `1..N` tanpa duplikasi atau jeda angka.
- Menambahkan tombol `[ ⇅ Atur Posisi (N) ]` pada Floating Action Bar saat $\ge 2$ unit terpilih.
- Mengosongkan seleksi otomatis setelah urutan diterapkan dan menyajikan notifikasi sukses non-teknis.

---

## 2. Before vs After

| Aspek | Sebelum Refactor 198 | Sesudah Refactor 198 |
|---|---|---|
| **Kondisi Normal Kartu** | Setiap kartu memuat bulatan `○` abu-abu kosong yang memakan ruang horizontal ~24px dan menambah kebisingan visual. | Kartu bersih dan lapang tanpa bulatan kosong. Area bodi kartu dapat di-tap langsung untuk memilih unit. |
| **Indikator Terpilih** | Hanya berupa border neon tanpa penanda centang eksplisit jika tombol checkbox tidak dilihat. | Border neon menyala + latar berpijar + **centang mini halus (*conditional checkmark*)** di samping nomor urut. |
| **Reorder Jarak Jauh (#14 ke #2)** | Harus menekan tombol panah naik `[↑]` sebanyak 12 kali berturut-turut. | Cukup sentuh badge nomor urut `[ 14 ]`, pilih `Di Atas Unit #2` (atau klik `⤒ Paling Depan`), selesai dalam 2 ketukan. |
| **Reorder Banyak Unit (Rombongan)** | Tidak ada fitur pemindahan rombongan; pengawas harus memindahkan bus satu per satu. | Cukup pilih $\ge 2$ unit, tap tombol `[ ⇅ Atur Posisi (N) ]` di bilah bawah, lalu selipkan rombongan ke urutan target sekaligus. |
| **Drag Handle di Ponsel** | Ikon titik seret `[::]` hadir namun rawan memicu konflik scroll halaman pada layar sentuh. | Dihapus sepenuhnya; reorder di ponsel 100% presisi via modal dan tombol panah pendamping. |

---

## 3. Case: Skenario Lapangan

### Skenario: Pergeseran 3 Bus Cadangan ke Urutan Terakhir
- **Situasi:** Pengawas JAK.115 di Tanjung Priok memiliki 3 unit bus cadangan di urutan #4, #7, dan #11 yang ingin dialihkan ke urutan paling belakang (urutan #13, #14, #15) agar armada utama berangkat lebih dulu.
- **Sebelum Refactor 198:** Pengawas harus mengklik panah bawah berkali-kali untuk unit #4, lalu unit #7, lalu unit #11 secara manual. Rawan salah hitung posisi akhir.
- **Sesudah Refactor 198:**
  1. Pengawas men-tap bodi kartu ketiga unit tersebut (ketiganya menyala dengan border neon dan centang mini).
  2. Bilah bawah memunculkan tombol `[ ⇅ Atur Posisi (3) ]`.
  3. Pengawas mengetuk tombol tersebut, lalu menekan `[ ⤓ Paling Belakang ]`.
  4. Seketika ketiga bus cadangan tersebut berpindah sebagai satu rombongan ke posisi paling akhir, dan seluruh bus lainnya bergeser naik secara rapi. Waktu eksekusi: **< 3 detik**!
