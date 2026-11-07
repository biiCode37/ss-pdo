# AUDIT TEMUAN TIPOGRAFI TIDAK KONSISTEN: REFACTOR 216
**Modul:** Seluruh UI (`src/**/*.tsx`, `src/**/*.ts` termasuk template HTML SweetAlert, `src/**/*.css`), terutama monitoring 18 rute, detail rute korwil, status armada, modal input bus, dan detail unit.
**Fokus Masalah:** Ukuran dan bobot huruf ditulis bebas oleh banyak agent sehingga ada puluhan nilai berbeda, banyak teks terlalu kecil untuk dibaca di lapangan, dan campuran satuan `px`/`rem`.

---

### ID Temuan: BUG-TYPO-216-01
- **Lokasi Kode:** 113 file; terbanyak `MonitoringFleetStatusTab.tsx`, `KorwilRouteDetailBottomSheet.tsx`, `MonitoringRouteCardModern.tsx`, `MonitoringRouteDetailModal.tsx`, `MonitoringKorwilTab.tsx`, `UnitDetailModal.tsx`, template `utils/modals/busInput/*`
- **Keparahan:** High (keterbacaan data operasional di HP)
- **Deskripsi:** 386 ukuran huruf di bawah 12px (8,5–11,5px), termasuk 9px dan 9,5px pada label data monitoring dan label navigasi bawah monitoring.
- **Dampak User:** Korlap/korwil kesulitan membaca angka dan label kecil di layar HP, apalagi di luar ruangan; risiko salah baca data.
- **Mitigasi:** Semua ukuran di bawah 12px dinaikkan ke 12px (batas minimum).

### ID Temuan: BUG-TYPO-216-02
- **Lokasi Kode:** Lintas modul (gaya inline, CSS global, string template SweetAlert)
- **Keparahan:** Medium (inkonsistensi visual)
- **Deskripsi:** 42+ nilai ukuran berbeda (mis. 11.5px, 12.5px, 13.5px, 15px, 17px, 0.78rem, 0.82rem, 0.88rem, 0.95rem, 1.15rem) dan campuran `px`/`rem`, sehingga teks setara tampil dengan ukuran berbeda antar halaman.
- **Dampak User:** Hierarki teks tidak jelas; tampilan terasa tidak rapi.
- **Mitigasi:** Normalisasi ke skala tetap 12/13/14/16/18/20/24/28 px (nilai terdekat; seri dibulatkan ke atas), `rem` dikonversi ke `px`.

### ID Temuan: BUG-TYPO-216-03
- **Lokasi Kode:** Lintas modul (`fontWeight: 800/900`, `font-weight: 800/900`, `fontWeight: 650`)
- **Keparahan:** Low
- **Deskripsi:** 105+ pemakaian bobot 800/900 (dan 650) membuat banyak teks "berteriak" sehingga tidak ada yang benar-benar menonjol.
- **Dampak User:** Tampilan berat dan padat; penekanan kehilangan makna.
- **Mitigasi:** 800/900 → 700, 650 → 600. Bobot yang diizinkan: 400, 500, 600, 700.
