# Task 5: Modal Generator Laporan WhatsApp (WaReportModal.tsx)

**Files:**
- Create: `src/components/WaReportModal.tsx`
- Create: `src/components/WaReportModal.test.tsx`

**Interfaces:**
- Consumes:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `regionalData: RegionalMonitoringResult`
  - `selectedDate: string`
- Produces:
  - Dialog modal interaktif:
    - Pilihan format (Format 1: Komprehensif vs Format 2: Rincian Shift)
    - Pilihan filter lingkup:
      - Seluruh Wilayah (18)
      - Ranto Lumban Toruan (6)
      - Abdul Manan (6)
      - Moamar Z.A. Mahu (6)
    - Banner peringatan ramah jika ada rute yang berstatus belum submit (draft / empty)
    - Area pratinjau teks pesan monospace
    - Tombol aksi:
      - "Salin ke Clipboard" (dengan toast sukses)
      - "Buka WhatsApp" (memanggil helper `openWhatsApp`)
