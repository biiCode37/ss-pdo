# Rekomendasi Solusi v4 — Proyek SS_PDO / SPUM

**Jenis dokumen:** Rekomendasi perbaikan untuk tiap temuan di `01-daftar-masalah-v4.md` (BUG-45 s.d. BUG-47)

---

## 🔴 KRITIS

### Solusi BUG-45 — Ganti parsing angka polos dengan `parseIndonesianNumber`
**Pendekatan:**
1. Di `utils/unitAnalytics.ts`, tambahkan `import { parseIndonesianNumber } from './numberUtils';` dan ganti SEMUA pemanggilan `parseInt(String(item.X || '0'), 10)` / `parseFloat(String(item.X || '0'))` dengan `parseIndonesianNumber(item.X)`.
2. Tambahkan kasus uji di `unitAnalytics.test.ts` (file test sudah ada) yang secara eksplisit menguji nilai berformat ribuan Indonesia (mis. `"1.234"` harus terbaca `1234`), persis seperti yang seharusnya dilakukan untuk BUG-20 sebelumnya — supaya regresi keempat (kalau nanti ada file baru lagi yang butuh parsing serupa) punya kesempatan lebih besar tertangkap otomatis.
3. **Rekomendasi tambahan untuk mencegah pola ini terulang KEEMPAT kalinya** (lihat juga `03-aturan-ai-agent-v4.md`): pertimbangkan menambahkan aturan lint kustom atau catatan di `.agents/AGENTS.md` yang secara eksplisit melarang pemanggilan `parseInt`/`parseFloat` langsung terhadap field dari `BusData` di luar `numberUtils.ts` — supaya code review (manusia maupun agent) punya sinyal jelas untuk menangkapnya sebelum merge, bukan cuma mengandalkan audit manual berkala seperti dokumen ini.

---

## 🟠 SEDANG

### Solusi BUG-46 — Hilangkan pencarian berulang di `extractUnitList`
**Pendekatan:** Ganti `calculateUnitMetrics(data, b.unit || '')` di dalam loop menjadi fungsi baru yang menerima BARIS-nya langsung, bukan mencarinya lagi:
```ts
// Sebelum: calculateUnitMetrics(data, targetUnit) — mencari ulang via data.find()
// Sesudah: calculateUnitMetricsFromRow(item) — langsung proses baris yang sudah ada
```
Pecah `calculateUnitMetrics` menjadi dua: satu fungsi inti yang menerima `item: BusData` langsung (dipakai oleh `extractUnitList`, O(n) total), dan satu wrapper tipis `calculateUnitMetrics(data, targetUnit)` yang melakukan `data.find()` SEKALI lalu memanggil fungsi inti (tetap dipertahankan untuk dipakai `UnitDetailModal`, yang memang hanya butuh SATU unit spesifik, sehingga O(n) di situ sudah wajar).

---

## 🟡 MINOR

### Solusi BUG-47 — Cache ringan untuk data grafik TOA bulanan
**Pendekatan:** Tambahkan cache in-memory sederhana (mis. `Map<string, {day,totalToa}[]>` dengan key `${sheetId}-${chartMaxDay}-${unitFilter ?? 'ALL'}`, disimpan di luar komponen atau lewat context/module-level singleton) di sekitar pemanggilan `getMonthlyToaTrend`. Cache boleh sesederhana "simpan hasil sukses terakhir per key, pakai ulang jika key sama dalam sesi yang sama" — tidak perlu invalidasi kompleks, karena data yang sama akan di-refresh wajar setiap kali `handleLoadData`/pull-to-refresh dipanggil di level Dashboard. Prioritas rendah — tidak mendesak, tapi mudah dikerjakan sekalian saat menyentuh area ini untuk BUG-45/46.
