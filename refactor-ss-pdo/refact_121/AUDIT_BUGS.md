# Audit Bugs: Revisi Banner Rollover & Bukti Kontras (Fase 3 Batch 3.4)

Dokumen ini mencatat temuan teknis dari audit Codex `refact_120` dan mitigasi implementasinya dalam `refact_121`.

---

## Daftar Temuan

### 1. ID: R120-01
- **Lokasi Kode:**
  - `src/components/busCard/modal/singleFocus/SingleFocusKmRolloverBanner.tsx:32-48`
  - `src/index.css:31-34,78-81`
- **Keparahan:** Sedang (Keterbacaan Instruksi Koreksi Odometer pada Layar Ponsel)
- **Deskripsi:**
  - Pada revisi sebelumnya (`refact_119`), hanya foreground tombol banner rollover yang diperbaiki. Judul banner berukuran `0.8rem` masih memakai token `--warning-color: #d97706`, dan isi teks penjelas saran berukuran `0.76rem` masih memakai token `--text-secondary: #6b7280`.
  - Latar belakang banner pada Light Mode adalah `--warning-badge-bg: rgba(234, 88, 12, 0.1)` yang terkomposisi di atas kartu putih `#ffffff` menjadi warna peach/oranye pucat `rgb(253, 238, 231)`.
  - Rasio kontras judul banner `#d97706` di atas latar komposit hanya mencapai **2.82:1**, dan teks penjelas `#6b7280` hanya mencapai **4.27:1**. Keduanya berada di bawah ambang batas minimum WCAG 2.1 AA sebesar **4.5:1** untuk teks ukuran normal/kecil.
- **Dampak User:**
  - Pengawas dan petugas operasional di lapangan dapat melihat tombol aksi dengan jelas, namun kesulitan membaca teks judul peringatan rollover dan angka rincian selisih KM sebelum memutuskan untuk menerapkan koreksi.
- **Mitigasi:**
  - Definisikan token semantik berorientasi kontras tinggi di `src/index.css`:
    - `--warning-banner-title`:
      - Light Mode: `#9a3412` (Tailwind orange-800, luminansi 0.0937). Memberikan rasio kontras **6.46:1** di atas latar banner komposit (Lolos WCAG AA $\ge 4.5:1$ dengan margin aman).
      - Dark Mode: `#f59e0b` (luminansi 0.4389). Memberikan rasio kontras **7.28:1** di atas latar banner gelap komposit (Lolos WCAG AAA $\ge 7.0:1$).
    - `--warning-banner-text`:
      - Menggunakan `var(--text-primary)`:
        - Light Mode (`#171717`): Memberikan rasio kontras **15.85:1** (Lolos WCAG AAA $\ge 7.0:1$).
        - Dark Mode (`#ededed`): Memberikan rasio kontras **13.36:1** (Lolos WCAG AAA $\ge 7.0:1$).
  - Perbarui style di `SingleFocusKmRolloverBanner.tsx` agar menggunakan kedua token tersebut.

---

### 2. ID: R120-02
- **Lokasi Dokumen:**
  - Laporan audit sebelumnya (`refact_119/REPAIR_REPORT.md` dan `refact_119/evidence/contrast-verification.txt`).
- **Keparahan:** Rendah (Konsistensi dan Reproduktibilitas Bukti Kualitas WCAG).
- **Deskripsi:**
  - Pada laporan `refact_119`, derivasi tertulis untuk luminansi sRGB tombol rollover mencantumkan `#d97706 = 0.2378` dan `#0f172a = 0.0135`, lalu menuliskan rumus `(0.2378 + 0.05)/(0.0135 + 0.05) = 4.53` namun menyatakannya kira-kira `5.60`.
  - Berdasarkan standar IEC 61966-2-1 sRGB yang tepat, luminansi relatif sebenarnya dari `#d97706` adalah **0.2796** dan `#0f172a` adalah **0.0088**, sehingga rasio `(0.2796 + 0.05)/(0.0088 + 0.05) = 0.3296 / 0.0588 = 5.60:1`. Kesimpulan rasionya benar, namun angka perantara yang ditulis sebelumnya keliru.
  - Selain itu, laporan `refact_119` mengasumsikan alpha komposit chip Shift 1 adalah 12%, sedangkan token CSS `--shift1-bg` aktual di `src/index.css:67` menggunakan alpha **8%** (`rgba(2, 132, 199, 0.08)`).
- **Dampak User/Tim:**
  - Bukti matematis tidak dapat direproduksi secara persis dari angka tertulis, mengurangi transparansi verifikasi kualitas.
- **Mitigasi:**
  - Buat skrip verifikasi mandiri yang dapat dieksekusi (`refactor-ss-pdo/refact_121/evidence/contrast-verification.js`) menggunakan nilai token aktual dan formula sRGB standar.
  - Simpan output eksekusi di `contrast-verification.txt` dengan persamaan dan nilai komposit yang 100% konsisten.
  - Catat errata formal di `refactor-ss-pdo/refact_121/REPAIR_REPORT.md` tanpa mengubah arsip riwayat `refact_119`.
