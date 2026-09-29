# Audit Bugs & Koreksi Batch 2.1 (Refact 84)

Dokumen ini mendokumentasikan temuan audit dan koreksi teknis untuk **Fase 2, Batch 2.1** pada proyek SS_PDO sesuai ketetapan `AGENTS.md`, `.agents/AGENTS.md`, dan evaluasi Codex pada `refact_83`.

---

## Daftar Temuan & Status Audit

| ID Temuan | Lokasi Kode | Keparahan | Status | Rujukan Asal |
| :--- | :--- | :--- | :--- | :--- |
| **R79-05** | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:70-74` | **High** | RESOLVED | `refact_79/AUDIT_BUGS.md` / `refact_82` |
| **R79-06** | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:76-82` | **Medium** | RESOLVED | `refact_79/AUDIT_BUGS.md` / `refact_82` |
| **R83-01** | `src/components/busCard/modal/useBusInputForm.ts:652,658,679,693,724,730,742,757,767` | **Medium** | RESOLVED | `refact_83/AUDIT_BUGS.md` (Codex Review) |
| **R83-02** | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:76-82` | **Medium** | RESOLVED | `refact_83/AUDIT_BUGS.md` (Codex Review) |

---

## Rincian Temuan

### 1. R79-05: Pembulatan Sepihak pada Fallback Total Ritase PP
- **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` (baris 70-74)
- **Keparahan:** **High** (Domain Integrity & SSOT)
- **Deskripsi:** Kode menggunakan `Math.round(route.totalTrips / 2)` pada fallback total ritase PP ketika `route.totalRitasePp` tidak didefinisikan. Pada data operasional lapangan dengan jumlah trip ganjil (misal 101 trip), ekspresi ini menghasilkan `51` ritase (dibulatkan naik), bukan `50.5` ritase PP murni.
- **Dampak Pengguna:** Pengawas wilayah dan korlap melihat angka capaian ritase yang terdistorsi dan tidak akurat terhadap rasio 1 Rit PP = 2 Trip.
- **Mitigasi:** Hapus `Math.round`. Gunakan pembagian murni `route.totalTrips ? route.totalTrips / 2 : 0` dengan tetap memprioritaskan nilai eksplisit `route.totalRitasePp !== undefined` (termasuk nilai `0`).

---

### 2. R79-06 & R83-02: Pemotongan Presisi Desimal pada Metrik Ritase per Bus
- **Lokasi:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx` (baris 76-82)
- **Keparahan:** **Medium** (Core Domain Precision)
- **Deskripsi:** Ketiga cabang penentuan `ritasePerBus` (nilai eksplisit `route.ritasePerBus`, turunan `route.tripsPerBus / 2`, dan kalkulasi fallback `totalRitasePp / realops`) dibungkus oleh `.toFixed(1)`. Hal ini memotong angka desimal presisi (misal `5.05` terpotong menjadi `5.1` atau `5.0`).
- **Dampak Pengguna:** Informasi produktivitas armada per bus kehilangan akurasi desimal sebenarnya dan melanggar aturan emas integritas data SSOT.
- **Mitigasi:** Hapus `.toFixed(1)` dari seluruh tiga cabang penentuan ritase per bus sehingga nilai numerik murni tampil penuh tanpa pemotongan sepihak.

---

### 3. R83-01: Hardcoded UI String Literal pada Pemanggil Validasi Odometer & TOA
- **Lokasi:** `src/components/busCard/modal/useBusInputForm.ts` (baris 652, 658, 679, 693, 724, 730, 742, 757, 767)
- **Keparahan:** **Medium** (Standardisasi UI & Anti-Hardcoded Strings)
- **Deskripsi:** Fungsi validator `validateKmCrossDay`, `validateKmPair`, dan `validateToaValue` menerima string literal hardcoded `"Shift 1"`, `"Shift 2"`, dan `"TOA Shift 2"` secara langsung alih-alih mengambil konstanta kamus teks terpusat.
- **Dampak Pengguna:** Pesan validasi modal berpotensi tidak konsisten dengan kamus antarmuka sentral, menyulitkan lokalisasi dan audit terminologi.
- **Mitigasi:**
  1. Tambahkan konstanta `LABEL_SHIFT_1: 'Shift 1'`, `LABEL_SHIFT_2: 'Shift 2'`, dan `LABEL_TOA_S2: 'TOA Shift 2'` pada `TEXT_ALERTS.BUS_INPUT_MODAL` di `src/constants/texts/text_alerts.ts`.
  2. Tambahkan uji integritas kamus baru di `src/constants/texts/texts.test.ts`.
  3. Ganti seluruh 9 call-site literal di `useBusInputForm.ts` dengan referensi kamus teks sentral.
  4. Tambahkan pengujian verifikasi kemunculan label kamus pada pesan error di `useBusInputForm.test.tsx`.

---

## Temuan untuk Fase Mendatang (Di Luar Batas Batch 2.1)

1. **`busModalPreConfirm.ts`:**
   Ditemukan penggunaan literal `"Shift 1"`, `"Shift 2"`, `"TOA Shift 1"`, `"Total TOA"` pada `src/utils/modals/busInput/busModalPreConfirm.ts`. File ini berada di luar batas Batch 2.1 dan dicatat sebagai kandidat audit kamus teks untuk Batch berikutnya / Fase 4.
2. **Metrik Non-Ritase di `MonitoringRouteDetailModal.tsx`:**
   Metrik seperti `kmPerBus`, `paxPerBus`, `paxPerKm`, `paxPercentage` masih mempertahankan formatting pembulatan/desimal bawaan modal. Sesuai batasan batch, perubahan tidak diperluas ke metrik non-ritase dan dicatat sebagai kandidat evaluasi Fase 4.
