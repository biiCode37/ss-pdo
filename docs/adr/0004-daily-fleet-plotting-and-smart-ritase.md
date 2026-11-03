# ADR 0004: Arsitektur Halaman Plotting Harian, Smart Ritase, dan Logika Rolling Armada

- **Status:** Diterima (*Accepted*)
- **Tanggal:** 2026-10-31
- **Penulis:** AntiGravity & Tim Pengembang SS_PDO
- **Domain:** Manajemen Plotting Armada Pagi, Halaman Input SS Harian Penuh, dan Validasi Fisika Rute

---

## 1. Konteks & Latar Belakang Lapangan

Pada operasional angkot Mikrotrans Transjakarta (seperti rute **JAK.115 Term. Tanjung Priok – Pegangsaan II IGI**), terdapat karakteristik fisik operasional yang sangat khas:

1. **Dua Titik Pengendapan (Dual Endpoints):**
   - Rute memiliki dua titik awal pemberangkatan subuh (jam 05.00): Titik A (**Term. Tanjung Priok**) dan Titik B (**Pegangsaan II IGI**).
   - Armada terbagi dua: "Unit Priok" (start awal dari Priok) dan "Unit IGI" (start awal dari IGI).
2. **Hukum Fisika Ritase vs Titik Akhir Operasional:**
   - **1 Ritase (PP)** = 2 Trip (1 Pergi + 1 Pulang). Jarak 1 Rit = `km_baku`.
   - **0.5 Ritase (Setengah)** = 1 Trip (1 arah).
   - **Ritase Bulat (misal 7.0 rit = 14 trip):** Titik awal = Titik akhir operasional (`Trip Pergi == Trip Pulang`).
   - **Ritase Setengah (misal 7.5 rit = 15 trip):** Titik awal $\neq$ Titik akhir operasional (`|Trip Pergi - Trip Pulang| == 1`).
     - Unit Priok + 7.5 rit $\rightarrow$ Wajib 8 Pergi, 7 Pulang $\rightarrow$ Mengendap di IGI.
     - Unit IGI + 7.5 rit $\rightarrow$ Wajib 7 Pergi, 8 Pulang $\rightarrow$ Mengendap di Priok.
   - **Invarian Mutlak:** Selisih trip tidak pernah boleh $> 1$, dan arah yang lebih banyak $+1$ pasti arah menjauhi pangkalan start awal.
3. **Logika Perputaran Armada (Rolling Harian / FIFO Fair Cycle):**
   - Untuk keadilan beban kerja dan rotasi jam istirahat pengemudi, unit yang berangkat pertama hari ini (#1) akan menjadi unit paling akhir esok hari di pangkalan tersebut.
   - Unit urutan kedua (#2) naik menjadi urutan pertama (#1), dan seluruh unit di bawahnya naik 1 tingkat.
4. **Pemisahan Peran Operasional:**
   - **Pagi Hari (Subuh):** Petugas menentukan urutan keberangkatan, titik start awal, target ritase, dan unit bermasalah.
   - **Sepanjang Hari Penuh (Input SS):** Halaman Input SS digunakan untuk mencatat realisasi operasional harian penuh (Full Day: Shift 1 & Shift 2), bukan hanya shift malam. Konfigurasi pagi menjadi acuan validasi seharian penuh.

---

## 2. Keputusan Arsitektur & Fungsional

### A. Penempatan Menu Plotting di Floating Bottom Dock
- Menu **Plotting** ditempatkan sebagai tab ke-4 pada Floating Bottom Dock di samping menu Armada:
  ```text
  ┌────────────────────────────────────────────────────────┐
  │  [📝 Input]   [📊 Dashboard]   [🚌 Armada]   [📋 Plotting] │
  └────────────────────────────────────────────────────────┘
  ```
- **Rasional:** Menjaga Dashboard utama tetap bersih dari penumpukan komponen, memanfaatkan navigasi jempol (*thumb-zone*), dan memisahkan ruang kerja perencanaan subuh dengan ruang kerja pencatatan harian.

### B. Pengelompokan Tampilan Berbasis Pangkalan (Dual Base Tabs)
- Di Halaman Plotting, unit dikelompokkan ke dalam 2 tab pangkalan paralel:
  - Tab 1: `[ 📍 Start Priok (X Unit) ]`
  - Tab 2: `[ 📍 Start IGI (Y Unit) ]`
- Masing-masing kelompok memiliki daftar urutan nomor jalan sendiri (#1, #2, #3...) sesuai jadwal pelepasan armada jam 05.00 dari masing-masing pangkalan.

### C. Mekanisme Penataan Urutan (Reordering Interaction)
1. **Penguncian Mode Aman (*Safety Guard*):**
   - Gestur drag-and-drop maupun tap+hold **hanya aktif** saat tombol **`[ ⚙️ Atur Urutan ]`** ditekan.
   - Saat mode aktif, seleksi teks peramban dimatikan total (`user-select: none`, `-webkit-touch-callout: none`).
2. **Fitur Cerdas `[ 🔄 Terapkan Rolling Kemarin ]` (Otomatis 1-Klik):**
   - Sistem membaca urutan plotting kemarin. Unit #1 kemarin otomatis ditaruh di urutan paling akhir hari ini pada masing-masing pangkalan, dan unit lainnya naik 1 tingkat.
3. **Aksi Cepat `[ ⬇️ Ke Bawah ]`:**
   - Tombol pada kartu urutan #1 untuk langsung memindahkan unit tersebut ke urutan terbawah dalam grupnya tanpa perlu dragging panjang di layar HP.
4. **Drag & Drop Ergonomis:**
   - Disediakan pegangan seret khusus (*Drag Handle* `⋮⋮`) pada kartu.
5. **Tap Berurutan (*Sequential Tap*):**
   - Opsi ketuk unit satu per satu untuk menyusun ulang urutan secara total dari awal.

### D. Mekanisme Penentuan Titik Start Awal
1. **Level 1 (Auto-Inherit Kemarin):**
   - Sistem menghitung posisi pengendapan terakhir tadi malam dari `titik_start` + `total_ritase` kemarin. Unit yang selesai di seberang otomatis di-set start di pangkalan seberang subuh ini.
2. **Level 2 (Multi-Select Komplementer):**
   - Petugas memilih unit yang start di Priok $\rightarrow$ tekan `[ Tetapkan Start Priok ]` $\rightarrow$ seluruh unit lainnya **otomatis ditetapkan sebagai Start IGI**.
3. **Level 3 (Toggle Mandiri per Kartu):**
   - Badge interaktif `[ 📍 Priok ⇄ IGI ]` pada kartu untuk membalik pangkalan 1 unit secara instan.

### E. Integrasi ke Halaman Input SS (Full Day)
1. **Badge Identitas:** Kartu bus di Input SS menampilkan badge plotting (`#1 • 📍 Priok`).
2. **Validasi Fisika di Modal Trip:**
   - Preset tombol target ritase dari data plotting (misal: `7.5 Rit`).
   - Auto-fill cerdas: Unit Priok + 7.5 rit otomatis mengisi `Pergi: 8, Pulang: 7`.
   - Validasi ketat: Blokir jika selisih $> 1$ trip atau arah terbalik.

### F. Status Komponen `QuickKorlapFleetModal`
- **Keputusan:** Pembersihan komponen `QuickKorlapFleetModal` resmi **dibatalkan / di-skip**.
- Komponen dibiarkan apa adanya di modul Monitoring Wilayah (18 rute) dan tidak disentuh, karena fungsi backend-nya (`fleetStatusService.ts`) juga digunakan oleh `A2ReportModal`. Modul ini terisolasi dan tidak berbenturan dengan Halaman Plotting Rute.

---

## 3. Skema Basis Data & Penyimpanan

### Tabel Supabase: `public.daily_route_plottings`
```sql
CREATE TABLE IF NOT EXISTS public.daily_route_plottings (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT REFERENCES public.routes(id) ON DELETE CASCADE,
  route_code TEXT NOT NULL,
  date DATE NOT NULL,
  endpoint_a_name TEXT,
  endpoint_b_name TEXT,
  units_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_daily_route_plottings UNIQUE (route_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_route_plottings_lookup 
  ON public.daily_route_plottings (route_id, date);
```

### Struktur Objek JSONB (`units_data`):
```typescript
export interface UnitPlottingItem {
  unit: string;
  order: number;
  start_point: 'A' | 'B';
  target_ritase: number;
  status: 'READY' | 'TROUBLE' | 'OFF';
  note?: string;
}
```

---

## 4. Utilitas Penyingkat Nama Titik (`src/utils/routeEndpointUtils.ts`)
Mengubah label panjang dari header Google Sheets menjadi ringkas untuk tampilan mobile:
- `"TERM. TANJUNG PRIOK"` $\rightarrow$ **`Priok`**
- `"PEGANGSAAN II IGI"` $\rightarrow$ **`IGI`**
- `"TERMINAL KAMPUNG RAMBUTAN"` $\rightarrow$ **`Kp. Rambutan`**
