# AUDIT TEMUAN KONTRAS STATUS AKTIF, RITME JARAK & HIJAU WARISAN: REFACTOR 221
**Modul:** Dock navigasi bawah, header (pil rute), tab/segmen/chip aktif di monitoring, laporan WA, laporan A2, manajemen pengguna & halaman; ritme jarak halaman Input SS, Dashboard, Armada; seluruh pemakaian hijau warisan.
**Fokus Masalah:** Penanda aktif memakai tint tipis yang nyaris sama dengan wadahnya di kedua tema, jarak antarbagian tidak seragam (terlalu jauh di Armada, konten terakhir menempel dock), dan warna hijau Supabase/emerald mentah masih tersebar.

---

### ID Temuan: BUG-CONTRAST-221-01
- **Lokasi Kode:** `src/index.css` (`.bottom-nav`, `.bottom-nav-item`, `.bottom-nav-item.active`)
- **Keparahan:** High (penanda navigasi utama tidak terlihat; WCAG 1.4.11)
- **Deskripsi:** Kapsul tab aktif memakai `--color-selection-bg` di atas dock `rgba(26,28,34,0.94)` / putih: kontras terukur **1,23:1 (gelap)** dan **1,15:1 (terang)**. Ikon tidak aktif memakai `rgba(255,255,255,0.75)` dan `#475569` mentah; dock memakai `backdrop-filter` dan bayangan `rgba` berlapis.
- **Dampak User:** Petugas sulit tahu sedang di tab mana; kapsul, teks, dan latar dock tampak menyatu.
- **Mitigasi:** Token baru `--color-state-active-bg/-fg` dan `--color-dock-bg/-border`; kapsul aktif kini **9,04:1 (gelap) / 5,93:1 (terang)** terhadap dock.

### ID Temuan: BUG-CONTRAST-221-02
- **Lokasi Kode:** `actions.css` (`.ui-chip-btn--accent`, pil rute), CSS `.swal-segment-btn.active`, `.swal-note-chip.active`, `.pdo-satset-toggle.active`; inline di `WaReportFormatTabs`, `MonitoringRouteDetailModal`, `MonitoringFleetStatusTab`, `MonitoringRoutesTab`, `MonitoringWaReportTab`, `MonitoringSupervisorTabs`, `MonitoringMonthPickerModal`, `MonthlySyncModal`, `QuickKorlapFleetModal`, `PageAccessConfigModal`, `A2ReportModal`, `ReportTrafficJamsSection`, `UserCardItem`, `UserManagementFilters`
- **Keparahan:** Medium
- **Deskripsi:** ±45 penanda aktif (tab, segmen, chip filter, toggle) memakai tint tipis (`--color-selection-bg`, `--card-bg`, `--input-bg`, `--color-surface-default`, `rgba(… 0.12–0.3)`), hijau `#3ECF8E`, biru `#2563eb`, atau emerald `#10b981` mentah. Pil rute memakai tint yang menyatu dengan header.
- **Dampak User:** Pilihan aktif tidak terbaca jelas; warna aktif berbeda-beda antar halaman.
- **Mitigasi:** Semua penanda aktif memakai `--color-state-active-*` (103 properti); pil rute bergaris tepi `--color-state-active-bg` (9,04:1 / 5,93:1). Modal input bus dikecualikan sementara (tahap berikutnya), tercatat di baseline ratchet `weakActiveState: 12`.

### ID Temuan: BUG-CONTRAST-221-03
- **Lokasi Kode:** `src/components/UnitCard.tsx` (`renderStatusBadge`) dan 26 file lain dengan `color` mentah
- **Keparahan:** High (teks gagal WCAG AA)
- **Deskripsi:** Badge "Hanya Shift 1" memakai teks `#f59e0b` di atas tint amber: **1,96:1** di mode terang (audit otomatis di aplikasi). Badge status ini juga disalin 5 kali dengan objek style inline. Selain itu 69 warna teks mentah berwarna (amber, merah, biru langit, ungu, hijau terang) belum teruji kontras di dua tema.
- **Dampak User:** Status shift unit tidak terbaca di siang hari.
- **Mitigasi:** Badge memakai komponen bersama `.ui-status[data-tone]` (pasangan token teruji); 69 warna teks dipetakan ke `--color-warning-fg`, `--color-error-fg`, `--color-link`, `--color-shift-2-fg`, `--color-success-fg`, `--color-text-secondary`.

### ID Temuan: BUG-SPACE-221-04
- **Lokasi Kode:** `src/index.css` (`.sticky-top-block`, `.app-container`, `.bus-list`, `.analytics-container`), `UnitSummaryDashboard.tsx`
- **Keparahan:** Medium (kerapian tata letak)
- **Deskripsi:** Jarak header→konten pertama: Armada **42px** (padding pembungkus 12 + `.search-container` 16 + margin 14), Input SS **20px**, Dashboard **28px**; kolom cari Armada→kartu 28px; antarkartu Dashboard 16px vs halaman lain 12px. Konten terakhir hanya ±8px di atas dock.
- **Dampak User:** Ada ruang kosong berlebih di satu halaman dan konten menempel dock di halaman lain.
- **Mitigasi:** Ritme tunggal 12px (header→konten, antarkartu, cari→daftar) dan ruang 20px di atas dock.

### ID Temuan: BUG-COLOR-221-05
- **Lokasi Kode:** 42+ file (`var(--accent-color[, #3ECF8E])`, `#3ECF8E`, `#24B47E`, `rgba(62, 207, 142, …)`, `#10B981`, `#059669`, `#34d399`), definisi `--accent-color` di `index.css` & `legacy.css`
- **Keparahan:** Low
- **Deskripsi:** 193 pemakaian hijau warisan Supabase dan emerald mentah tersisa.
- **Dampak User:** Warna aksen tidak konsisten dengan identitas biru.
- **Mitigasi:** Dipetakan ke token aksi/link/sukses/bayangan sesuai properti; variabel `--accent-color` dihapus; metrik ratchet `legacyAccentColor` dikunci di **0**.
