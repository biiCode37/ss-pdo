# Design Specification: Smooth Morphing Route Selector (SS_PDO)

**Tanggal:** 31 Juli 2026  
**Status:** Disetujui (Approved)  
**Fokus Utama:** iOS-style Fluid Morphing Animation & Space Optimization  

---

## 1. Ringkasan Fitur (Feature Overview)

Form pemilihan Rute & Tanggal di aplikasi **SS_PDO** ditingkatkan dengan **Animasi Morphing Halus (*iOS-style Fluid Morphing*)**. 

Saat pertama kali dibuka atau ketika belum memuat data, form tampil penuh berupa kartu input. Begitu pengguna menekan tombol **"Load Data Bus"**, kartu tersebut secara mulus berkontraksi (*morphing transition*) menjadi **Compact Pill Header Bar** setinggi ~42px. 

Ketika pengguna ingin mengganti Rute atau Tanggal, pengguna cukup menekan tombol `[ ✏️ Ubah ]`, dan Pill tersebut akan kembali mengembang (*morph expand*) menjadi form input utuh dengan animasi yang sangat *smooth*.

---

## 2. Arsitektur Komponen & Efek Morphing

### 2.1 Komponen Baru: `src/components/RouteSelectorCard.tsx`
Memisahkan logika dan tampilan selector dari `Dashboard.tsx` agar kode tetap rapi dan *maintainable*.

```
src/components/
├── RouteSelectorCard.tsx   # Komponen form selector dengan animasi morphing
└── Dashboard.tsx           # Container utama yang mengontrol state busData
```

### 2.2 Spesifikasi Animasi & CSS Morphing
- **CSS Timing Function:** `transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);` (memberikan kurva gerakan kenyal/fluid ala iOS).
- **Morphed Compact Pill (Saat Data Ter-load):**
  - Ringkas, melayang di bagian atas dengan efek *glassmorphism glow*.
  - Menampilkan icon rute aktif (`📍 JAK.76`), badge tanggal (`📅 Tanggal 31`), dan tombol pintas `[ ✏️ Ubah Rute / Tanggal ]`.
- **Form Expanded (Saat Mengedit):**
  - Mengembang secara mulus menampilkan pilihan rute tersimpan, dropdown tanggal, dan tombol "Load Data Bus".

---

## 3. Rencana Verifikasi (Verification Plan)

1. **Uji Transisi Morphing:**
   - Memastikan transisi *expand/collapse* berjalan mulus pada kecepatan 60fps tanpa ada elemen yang terpotong (*overflow clipping*).
2. **Uji Verifikasi Build & Lint:**
   - Menjalankan `pnpm run build` untuk memastikan type check `strict: true` lulus 100%.
3. **Uji Mobile Responsiveness:**
   - Menguji di layar mobile (375px–430px) pada mode **Light** dan **Dark** untuk kenyamanan visual.
