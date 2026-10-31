# AUDIT BUGS — Refactor 179: Perbaikan Layout Bottom Sheet Detail Rute Monitoring Wilayah (Full-Width Fleet & Zero Void)

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`, `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`.

---

## Daftar Temuan Masalah

| ID | Keparahan | Lokasi Kode | Deskripsi Masalah | Dampak Pengguna | Status Perbaikan |
|---|---|---|---|---|---|
| **BUG-179-01** | P1 (Tinggi - Layout Corrupted & Visual Breakage) | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:557–795` | Pada Bottom Sheet modal rute ("Detail Operasional Rute" di halaman Monitoring Wilayah), tag penutup `</div>` pada kartu metrik Pelanggan/KM dan kontainer grid 2 kolom (`display: grid, gridTemplateColumns: "1fr 1fr"`) hilang/terpotong. Akibatnya, seluruh blok `{/* Status Kesiapan Armada Bus */}` bersarang secara tidak sengaja (*accidentally nested*) di dalam kolom grid sebelah kanan. Hal ini menyebabkan kolom kiri kartu ("Total KM Tempuh") terhenti di ketinggian ~60px, sedangkan kolom kanan membengkak memanjang mengikuti ratusan pixel daftar armada. Di layar ponsel (lebar 360–400px), sisi kiri menjadi area kosong melompong (void navy ~50% layar) saat di-scroll, dan kartu armada di kolom kanan terdesak sempit (~170px) sehingga teks terpotong dan tumpang tindih. | Pengawas lapangan, Korwil, dan manajemen melihat antarmuka yang sangat rusak, asimetris, dan berantakan ketika memeriksa detail rute yang memiliki unit kendala. Informasi unit kendala terdesak sempit, sulit dibaca, dan separuh layar di sisi kiri terbuang sia-sia sebagai ruang kosong hitam/navy. | **TERATASI (Resolved)** — Menutup secara presisi tag kartu metrik Pelanggan/KM dan kontainer 2-column grid. Blok `{/* Status Kesiapan Armada Bus */}` direlokasi menjadi blok kartu mandiri dengan lebar penuh (`width: "100%"`), border radius 14px, padding proporsional, dan penataan item armada bus yang membentang rapi dari ujung kiri ke kanan dengan pembagian ruang bodi, catatan kendala, dan badge status yang seimbang. |
| **BUG-179-02** | P2 (Sedang - Color Token Consistency & Theming) | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:140–1180` | Komponen modal masih memuat fallback warna lama seperti `var(--card-bg, #18181b)`, `var(--text-primary, #ffffff)`, serta border dan gradien statis (`linear-gradient(135deg, #10B981...)`, `boxShadow: rgba(...)`) yang kurang adaptif terhadap sistem tema ganda (Light Mode dan Dark Mode) sesuai standar Refactor 174. | Pada pergantian mode tampilan (khususnya saat ponsel beralih ke Light Mode), kontras latar modal, teks sekunder, dan kartu metrik armada berisiko tidak mencapai rasio kontras WCAG AA/AAA, menyebabkan teks redup dan batas kartu kurang tegas. | **TERATASI (Resolved)** — Memigrasikan seluruh styling JSX dari hardcoded color & fallback lama ke CSS Variables token semantik adaptif dari `src/styles/tokens/semantic.css`: `var(--color-surface-default)`, `var(--color-surface-subtle)`, `var(--color-text-primary)`, `var(--color-text-secondary)`, `var(--color-border-subtle)`, `var(--color-action-primary-bg)`, `var(--color-success-*)`, `var(--color-warning-*)`. |

---

## Analisis Akar Masalah (Root Cause Analysis)

### 1. Tag Penutup JSX Bocor / Hilang
Pada penambahan fitur kesiapan armada sebelumnya:
```tsx
{/* Row 3: KM Tempuh & Pelanggan / KM (2 columns) */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
  <div>{/* KM Tempuh */}</div>
  <div>{/* Pelanggan / KM */}
    <div>Subteks Cap/Target</div>
    {/* SEHARUSNYA DITUTUP DI SINI: </div> </div> */}
    {/* Status Kesiapan Armada Bus MASUK DI SINI SECARA ILEGAL */}
    <div style={{ ... }}>Armada Bus</div>
  </div>
</div>
```
Karena elemen `<div>` induknya adalah CSS Grid dengan `gridTemplateColumns: "1fr 1fr"`, browser merender blok armada bus di dalam sel grid baris 1 kolom 2. Kolom 1 hanya berisi kartu KM tempuh setinggi ~60px, sehingga kolom 1 berhenti di atas, sedangkan kolom 2 membentang ratusan piksel ke bawah. Di sebelah kiri kolom 2 yang panjang tersebut tidak ada elemen apa pun, menghasilkan "void" kosong besar berwarna navy.

### 2. Inkonsistensi Token Desain Semantik
Modal detail rute dirancang sebelum finalisasi sistem token semantik `semantic.css` (Refactor 174), sehingga menggunakan kombinasi variabel legacy (`--card-bg`, `--text-primary`) dengan fallback hardcoded gelap (`#18181b`, `#ffffff`). Ketika dibuka di tema terang (Light Mode), beberapa teks dan kontainer tidak beradaptasi dengan warna permukaan terang dan teks kontras tinggi.

---

## Mitigasi & Validasi Perbaikan

1. **Restrukturisasi Hirarki JSX:**
   - Menutup kartu metrik "Pelanggan / KM" dan tag kontainer grid 2 kolom sebelum deklarasi blok armada bus.
   - Menempatkan blok `route-modal-fleet-section` sebagai elemen tingkat atas (*top-level sibling*) di dalam wadah Tab 1, dengan lebar penuh (`width: "100%"`), `boxSizing: "border-box"`, dan radius 14px.
2. **Penyempurnaan Layout List Armada (Mobile-First Ergonomic):**
   - Setiap kartu unit kendala menggunakan Flexbox horizontal: sisi kiri fleksibel memuat nomor bodi (`13px font-extrabold`) dan deskripsi kendala (`11px text-secondary ellipsis`), sisi kanan memuat badge status (`OFF`/`T.O`) dan tag shift (`S1 • S2`).
3. **Penyelarasan Token Warna Semantik (Light & Dark Ready):**
   - Latar modal: `var(--color-surface-default)`.
   - Latar kartu/item: `var(--color-surface-subtle)`.
   - Teks bodi: `var(--color-text-primary)` (kontras > 13:1).
   - Teks sekunder: `var(--color-text-secondary)`.
   - Garis batas: `var(--color-border-subtle)`.
4. **Verifikasi Otomatis:**
   - Menambahkan unit test baru di `MonitoringRouteDetailModal.test.tsx` untuk memverifikasi bahwa `route-modal-fleet-section` dirender sebagai kontainer berlebar penuh 100% dan parent element-nya bukan grid (`display !== 'grid'`).
   - Seluruh 17 tests di `MonitoringRouteDetailModal.test.tsx` dan 114 tests di `color-contract.test.ts` lulus 100%.

