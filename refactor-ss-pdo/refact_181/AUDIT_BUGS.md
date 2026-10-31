# AUDIT BUGS — Refactor 181: Eliminasi Badge Redundan dan Misleading [S1 • S2] pada Daftar Unit Kendala Armada

**Tanggal:** 31 Oktober 2026  
**Basis Repositori:** branch `devmode`  
**Ruang Lingkup:** `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx`, `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx`, `src/components/monitoring/modals/MonitoringRouteDetailModal.test.tsx`.

---

## Daftar Temuan Masalah

| ID | Keparahan | Lokasi Kode | Deskripsi Masalah | Dampak Pengguna | Status Perbaikan |
|---|---|---|---|---|---|
| **BUG-181-01** | P2 (Sedang - Misleading Information & Layout Noise) | `src/components/monitoring/modals/MonitoringRouteDetailModal.tsx:794–807`, `src/components/monitoring/tabs/MonitoringFleetStatusTab.tsx:1269–1281` | Pada Bottom Sheet modal rute ("Detail Operasional Rute") dan tab Status Armada, setiap unit kendala secara otomatis dirender dengan badge `[S1 • S2]` berdampingan dengan badge status (`[OFF]`, `[BA.02]`, `[TEKNIS]`, `[T.O]`). Hal ini terjadi karena proses ingesti spreadsheet Google Sheets (yang hanya memiliki satu kolom keterangan per hari) mendistribusikan keterangan tersebut ke array unit shift 1 dan shift 2 sekaligus. Akibatnya, 100% armada yang berstatus kendala/libur ditampilkan dengan badge `[S1 • S2]`. | Pengguna dan pengawas lapangan mengalami kesalahpahaman serius: mereka mengira bahwa keterangan kendala tersebut (misal `BA.02 Kendala Mesin` atau `Perbaikan Radiator`) sengaja diberikan atau berlaku secara resmi untuk 2 shift penuh (seharian), padahal catatan tersebut bisa jadi hanya insiden di salah satu shift. Selain itu, badge `[S1 • S2]` memakan ruang horizontal ~55px, mendesak teks keterangan kendala di sebelah kiri sehingga terpotong (*truncated with ellipsis*) pada layar ponsel. | **TERATASI (Resolved)** — Menghapus badge `[S1 • S2]` dari kartu unit kendala di `MonitoringRouteDetailModal.tsx` dan `MonitoringFleetStatusTab.tsx`. Sisi kanan kartu kini murni menampilkan badge identitas status operasional (`[OFF]`, `[BA.02]`, `[TEKNIS]`, `[T.O]`). Teks catatan kendala di sisi kiri mendapatkan ruang horizontal penuh tanpa terpotong, serta menghilangkan potensi kesalahpahaman operasional secara total. |

---

## Analisis Akar Masalah (Root Cause Analysis)

### 1. Desain Data Ingesti Spreadsheet vs Penyajian UI
Pada Google Sheets operasional rute harian, setiap baris unit armada hanya memiliki 1 kolom `KETERANGAN` umum untuk hari tersebut (misal: "BA.02 Service Berkala" atau "OFF"). Pada saat service `regionalIngestionService.ts` memproses baris tersebut:
```ts
nonSgoUnitsS1.push(nonOperatingItem);
nonSgoUnitsS2.push(nonOperatingItem);
```
Unit yang tidak operasi atau memiliki keterangan khusus dimasukkan ke dalam daftar Shift 1 dan Shift 2 secara seragam. Saat fungsi `extractRouteTroubledUnits` mengagregasi data tersebut:
```ts
if (!existing.shifts.includes(sh)) existing.shifts.push(sh);
```
Array `u.shifts` selalu bernilai `[1, 2]`.

### 2. Efek UI yang Tidak Relevan & Membingungkan
Komponen UI sebelumnya merender:
```tsx
<span className="...">
  {u.shifts.map((s) => `S${s}`).join(" • ")}
</span>
```
Karena 100% unit kendala memiliki `[1, 2]`, seluruh kartu unit di layar menampilkan badge abu-abu `[S1 • S2]`. Di mata pengawas atau manajemen di lapangan:
- Muncul persepsi keliru bahwa catatan kendala tersebut berlaku mutlak sepanjang hari di 2 shift.
- Tampilan terasa penuh sesak (*visual clutter*).
- Informasi penting mengenai jenis kendala terpotong (misal `BA.02 Kendala Mesin (temp...`).

---

## Mitigasi & Validasi Perbaikan

1. **Eliminasi Badge Shift:**
   - Menghapus rendering elemen `<span>{u.shifts.map((s) => `S${s}`).join(" • ")}</span>` pada `MonitoringRouteDetailModal.tsx` dan `MonitoringFleetStatusTab.tsx`.
   - Mengalokasikan ruang kosong yang ditinggalkan untuk teks keterangan kendala (`u.note`), sehingga nomor unit dan rincian masalah tampil utuh dan nyaman dibaca.
2. **Uji Otomatis Anti-Regresi:**
   - Menambahkan assertion eksplisit `expect(container.textContent).not.toContain("S1 • S2");` pada pengujian unit kendala di `MonitoringRouteDetailModal.test.tsx`.
   - Menjalankan seluruh 17 unit test modal detail rute dengan hasil 100% lulus.

