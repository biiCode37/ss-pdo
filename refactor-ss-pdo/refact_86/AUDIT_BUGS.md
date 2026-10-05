# Audit Bugs & Koreksi Batch 2.1 Revisi (Refact 86)

Dokumen ini mendokumentasikan temuan audit dan perbaikan teknis revisi untuk **Fase 2, Batch 2.1** pada proyek SS_PDO berdasarkan ketetapan `AGENTS.md`, `.agents/AGENTS.md`, serta audit review Codex pada `refact_85`.

---

## Daftar Temuan & Status Audit

| ID Temuan | Lokasi Kode / Dokumen | Keparahan | Status | Rujukan Asal |
| :--- | :--- | :--- | :--- | :--- |
| **R79-05** | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:70-74` | **High** | RESOLVED | `refact_79` (Fallback total ritase PP) |
| **R79-06** | `src/components/busCard/modal/useBusInputForm.ts:652,658...` | **Medium** | RESOLVED | `refact_79:49` (Label error validasi di form bus) |
| **R83-01** | `src/components/busCard/modal/useBusInputForm.ts` | **Medium** | RESOLVED | `refact_83` (9 call-site validator terlewat di Fase 1) |
| **R83-02** | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:76-82` | **Medium** | RESOLVED | `refact_83` (Presisi 3 cabang ritase per bus tanpa `.toFixed(1)`) |
| **R85-01** | `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx:273,300` | **Medium** | RESOLVED | `refact_85` (Asersi nol ritase membedakan 0 dari 50) |
| **R85-02** | `useBusInputForm.ts` & `MonitoringRouteDetailModal.tsx` | **Medium** | RESOLVED | `refact_85` (Pembersihan sisa literal UI fallback & compound unit) |
| **R85-03** | `refactor-ss-pdo/refact_84/AUDIT_BUGS.md` | **Low** | RESOLVED | `refact_85` (Koreksi pemetaan ID historis pada laporan baru) |

---

## Rincian Temuan & Solusi

### 1. R85-01: Asersi Nol Ritase Tidak Membedakan Hasil Salah
- **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx` (baris 273, 300)
- **Keparahan:** **Medium** (Mutu Regresi Domain)
- **Deskripsi:** Asersi `expect(container.textContent).toContain("0 Rit")` memeriksa seluruh container modal. Jika implementasi keliru menghasilkan `"50 Rit"`, asersi ini tetap lolos karena substring `"0 Rit"` ada pada angka 5**0 Rit**. Hal ini menyamarkan potensi regresi fallback atau prioritas nilai eksplisit `0`.
- **Dampak User:** Pengawas rute berisiko melihat angka ritase salah 50 padahal seharusnya 0 jika regresi terjadi tanpa terdeteksi unit test.
- **Mitigasi:**
  - Buat helper `getMetricCardValue(container, labelText)` yang menargetkan persis kartu metrik `TOTAL_RITASE_PP` dan `RITASE_BUS`.
  - Ganti asersi menjadi `expect(cardValue).toBe("0 Rit")` dan tambahkan `expect(cardValue).not.toBe("50 Rit")`.
  - Jika nilai aktual kartu adalah `"50 Rit"`, tes dipastikan **GAGAL** (`"50 Rit" !== "0 Rit"`).

---

### 2. R85-02: Teks Antarmuka Masih Literal dalam Dua File Source Target
- **Lokasi:**
  - `src/components/busCard/modal/useBusInputForm.ts:653, 680, 707, 712, 733, 755, 969`
  - `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:193, 293, 510, 719, 735`
- **Keparahan:** **Medium** (Kepatuhan Golden Rule Kamus Teks Sentral)
- **Deskripsi:**
  - `useBusInputForm.ts` masih menggunakan fallback literal `"Kemarin"`, `"Trip Pergi"`, dan `"Trip Pulang"` dalam parameter validasi.
  - `MonitoringRouteDetailModal.tsx` masih memuat `"Mikrotrans"`, `title="Tutup Modal"`, `Org/KM`, serta akhiran literal `/Bus` yang digabung secara ad-hoc dengan `UNIT_RIT` dan `UNIT_PAX`.
- **Dampak User:** Inkonsistensi tampilan antarmuka saat istilah kamus diubah dan melanggar standar lokalisasi sentral.
- **Mitigasi:**
  1. Tambahkan ke `TEXT_ALERTS.BUS_INPUT_MODAL` di `text_alerts.ts`:
     - `LABEL_PREVIOUS_DAY: 'Kemarin'`
     - `LABEL_TRIP_PERGI: 'Trip Pergi'`
     - `LABEL_TRIP_PULANG: 'Trip Pulang'`
  2. Tambahkan ke `TEXT_MONITORING.ROUTE_DETAIL_MODAL` di `text_monitoring.ts`:
     - `DEFAULT_OPERATOR: "Mikrotrans"`
     - `ACTIONS.BTN_CLOSE_TITLE: "Tutup Modal"`
     - `METRICS.UNIT_RIT_PER_BUS: "Rit/Bus"`
     - `METRICS.UNIT_PAX_PER_BUS: "Org/Bus"`
     - `METRICS.UNIT_PAX_PER_KM: "Org/KM"`
  3. Ganti seluruh pemanggilan literal pada kedua file source target dengan konstanta kamus tersebut.
  4. Tambahkan pengujian integritas token kamus baru pada `src/constants/texts/texts.test.ts`.

---

### 3. R85-03: Koreksi Pemetaan ID Temuan Historis
- **Lokasi:** Dokumentasi audit
- **Keparahan:** **Low** (Ketertelusuran Audit)
- **Deskripsi:** Pada `refact_84/AUDIT_BUGS.md`, R79-06 sempat tertulis sebagai masalah presisi ritase per bus. Sesuai catatan asli `refact_79/AUDIT_BUGS.md:49` dan koreksi Codex di `refact_85`, pemetaan yang benar adalah:
  - **R79-05:** Pembulatan sepihak `Math.round(totalTrips / 2)` pada fallback total ritase PP di `MonitoringRouteDetailModal.tsx`.
  - **R79-06:** Label error validasi hardcoded di `useBusInputForm.ts`.
  - **R83-01:** Sembilan call-site pemanggil fungsi validator di `useBusInputForm.ts` yang terlewat dalam paket pengerjaan Fase 1.
  - **R83-02:** Pemotongan presisi desimal ritase per bus via `.toFixed(1)` pada 3 cabang kalkulasi di `MonitoringRouteDetailModal.tsx`.
- **Status Aktual:** Seluruh temuan R79-05, R79-06, R83-01, dan R83-02 telah **RESOLVED 100%**.

---

## Batasan & Rekomendasi Fase Berikutnya

1. **`busModalPreConfirm.ts`:** Pemanggilan validasi pada modal pre-confirm cepat masih menggunakan literal string tersendiri. File ini berada di luar batas Batch 2.1 dan dicatat untuk migrasi kamus pada batch berikutnya / Fase 4.
2. **Kalkulasi Metrik Non-Ritase:** Formatting angka pada metrik pelanggan (`paxPerKm`, `paxPercentage`, `kmPerBus`) tidak diubah dalam batch ini untuk menjaga kemurnian cakupan batch.
