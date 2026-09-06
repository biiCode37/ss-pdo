# REPAIR REPORT: VISIBILITAS & AKSES CEPAT EDIT TRIP PER UNIT (REFACTOR 13)

Dokumen ini mencatat implementasi teknis perbaikan bug/gap UX **TRIP-13-01** terkait akses dan visibilitas pencatatan Trip Operasional per unit armada pada aplikasi SS_PDO.

---

## 1. Ringkasan Implementasi Perbaikan

### Latar Belakang & Akar Masalah:
Sebelumnya, pengaturan jumlah trip armada terkesan hanya bisa dilakukan secara masal melalui tombol *"Set Jumlah Trip"*. Petugas di lapangan tidak menyadari bahwa fitur edit trip per unit sebenarnya sudah didukung oleh backend dan spreadsheet, karena:
1. Kartu armada bus (`BusCard.tsx`) hanya menampilkan indikator KM dan Penumpang (`... KM` dan `... Pnp`), tanpa adanya visualisasi status trip ritase unit.
2. State `formData` di `BusCard.tsx` tidak melacak `tripPergi` dan `tripPulang`.
3. Modal entri bus (`busInputModal.ts`) selalu membuka tab `🔵 Shift 1` secara default, sehingga tab `🚌 Trip` tersembunyi di urutan ke-3.
4. Dropdown "Fokus Kolom" di `BusList.tsx` tidak menyediakan kategori khusus `Trip`.

### Solusi Teknis yang Diterapkan:
1. **Interactive Trip Badge pada Kartu Armada (`src/components/BusCard.tsx`):**
   - Menambahkan pelacakan `tripPergi` dan `tripPulang` pada state `formData` dan siklus `useEffect` sinkronisasi `bus`.
   - Merender badge Trip interaktif di samping badge KM dan Pnp:
     - **Normal / Lengkap (misal `4/4 Rit`):** Latar emerald lembut (`rgba(16, 185, 129, 0.10)`), teks hijau tegas (`#10b981`), dan border tipis.
     - **Terpangkas / Kendala Operasional (misal `3/2 Rit`, `2/1 Rit`, atau `0`):** Latar amber peringatan (`rgba(245, 158, 11, 0.12)`), teks oranye peringatan (`var(--warning-text, #f59e0b)`), dan border kontras. Pengendali lapangan langsung melihat unit yang bermasalah secara sekilas (*at-a-glance*).
     - **Belum Terisi:** Latar netral (`var(--input-bg)`) dengan label `—/— Rit`.
   - **Shortcut 1-Tap Langsung ke Tab Trip:**
     Badge Trip memiliki handler `onClick={(e) => { e.stopPropagation(); handleOpenModal('trip'); }}`. Men-tap badge langsung membuka modal pada tab `🚌 Trip` tanpa harus berpindah manual dari Shift 1.
2. **Dukungan `initialTab` & Mode Fokus Kolom Trip (`src/utils/modals/busInputModal.ts`):**
   - Menambahkan opsi `initialTab?: 'shift1' | 'shift2' | 'trip' | 'notes'` pada `BusModalOptions`.
   - Menyesuaikan tab aktif dan panel yang tampil pada segmented control Mode ALL berdasarkan `initialTab`.
   - Mengarahkan fokus kursor (`primaryInput`) otomatis ke field `Trip Pergi` saat tab Trip dibuka.
   - Menambahkan form khusus mode fokus `activeCategory === 'trip'` lengkap dengan input Trip Pergi, Trip Pulang, dan chip `+ Catatan Kendala`.
   - Menambahkan penanganan `activeCategory === 'trip'` pada validasi `preConfirm`.
3. **Penambahan Kategori "Trip Armada" pada Dropdown Kontrol (`src/components/BusList.tsx`):**
   - Menambahkan opsi `{ id: "trip", label: "Trip Armada" }` ke dalam `categories`.
   - Memperbarui fungsi `isBusFilled` agar mendukung pengecekan keterisian `tripPergi` dan `tripPulang`.
4. **Desain Sentuhan Tactile Micro-Interaction (`src/index.css`):**
   - Menambahkan kelas `.bus-card-badge-trip` dengan animasi pegas fisik Apple (`cubic-bezier(0.32, 0.72, 0, 1)`), efek hover brightness, dan tactile press feedback `:active { transform: scale(0.95); }`.

---

## 2. Before vs After

### A. Alur Kerja Petugas Lapangan saat Ada Unit Bermasalah (Mogok / Laka / Pangkas Rute)

#### Before:
```
Armada JAK.117-05 mogok di siang hari (hanya capai 3 pergi / 2 pulang)
   │
   ├─► Petugas melihat kartu bus di layar: TIDAK ADA info trip sama sekali
   ├─► Petugas bingung mengira trip hanya bisa diset masal ("Set Jumlah Trip")
   └─► Jika petugas membuka modal unit, harus membuka Shift 1 dulu,
       lalu mencari-cari letak tab Trip di urutan ke-3.
```

#### After:
```
Armada JAK.117-05 mogok di siang hari
   │
   ├─► Petugas langsung men-tap badge [ 🚌 4/4 Rit ] di kartu armada
   │     └─► 1-Tap Shortcut: Modal seketika terbuka langsung pada tab 🚌 Trip!
   │
   ├─► Petugas mengubah Trip Pergi: 3, Trip Pulang: 2, dan mengisi Catatan: "MGK JAM 13.00 DI PGC"
   │     └─► Tekan Simpan
   │
   └─► Kartu armada seketika reaktif mengupdate badge menjadi:
         [ ⚠️ 3/2 Rit ] (Berwarna Amber Peringatan)
         + Catatan Kendala tampil di bawah kartu bus.
       Petugas pengendali langsung tahu unit tersebut mengalami kendala ritase!
```

---

### B. Potongan Kode Kunci

#### 1. `src/components/BusCard.tsx`
```diff
+ const pergiVal = formData.tripPergi ?? bus.tripPergi;
+ const pulangVal = formData.tripPulang ?? bus.tripPulang;
+ const hasPergi = Boolean(pergiVal && String(pergiVal).trim() !== "");
+ const hasPulang = Boolean(pulangVal && String(pulangVal).trim() !== "");
+ const hasTrip = hasPergi || hasPulang;
+ const isImbalanced = hasTrip && pergiVal !== pulangVal;

+ {/* Badge Trip (Interactive Shortcut per unit) */}
+ <button
+   type="button"
+   onClick={(e) => {
+     e.stopPropagation();
+     handleOpenModal("trip");
+   }}
+   className="bus-card-badge-trip"
+   title="Trip Operasional (Klik untuk edit Trip per unit)"
+   style={{
+     backgroundColor: isImbalanced ? "rgba(245, 158, 11, 0.12)" : hasTrip ? "rgba(16, 185, 129, 0.10)" : "var(--input-bg)",
+     color: isImbalanced ? "var(--warning-text, #f59e0b)" : hasTrip ? "#10b981" : "var(--text-secondary)",
+     border: `1px solid ${isImbalanced ? "rgba(245, 158, 11, 0.3)" : hasTrip ? "rgba(16, 185, 129, 0.25)" : "var(--card-border)"}`,
+   }}
+ >
+   <ArrowRightLeft size={11} style={{ flexShrink: 0 }} />
+   <span>{hasTrip ? `${pergiVal || 0}/${pulangVal || 0} Rit` : `—/— Rit`}</span>
+ </button>
```

#### 2. `src/utils/modals/busInputModal.ts`
```diff
+ const initTab = options.initialTab || "shift1";
...
+ <button type="button" class="swal-segment-btn ${initTab === 'trip' ? 'active' : ''}" data-target="trip">🚌 Trip</button>
...
+ <div id="swal-panel-trip" class="swal-panel-section" data-panel="trip" style="display: ${initTab === 'trip' ? 'block' : 'none'}; ...">
```

---

## 3. Case: Skenario Lapangan

### Skenario: Penanganan Armada Mogok di Jam Operasional Siang
- **Kondisi Awal:**
  Pukul 06.00 pagi, petugas menetapkan target armada rute melalui "Set Jumlah Trip": Pergi 4, Pulang 4 (Total 8 trip/rit). Semua kartu unit bus menampilkan badge `4/4 Rit` berwarna hijau.
- **Insiden Lapangan:**
  Pukul 13.15 WIB, unit `JAK.117-08` mengalami kerusakan kopling di Halte Petamburan setelah menyelesaikan 3 trip pergi dan 2 trip pulang.
- **Tindakan Petugas via SS_PDO:**
  1. Petugas mencari `JAK.117-08` di daftar bus.
  2. Petugas men-tap langsung pada badge `4/4 Rit` di kartu unit tersebut.
  3. Modal terbuka seketika di tab **`🚌 Trip`**, kursor langsung aktif di field `Trip Pergi`.
  4. Petugas mengubah angka menjadi `3` dan `2`, lalu menekan chip `+ Catatan Kendala` dan memilih atau mengetik `MOGOK KOPLING DI PETAMBURAN JAM 13.15`.
  5. Petugas menekan **Simpan**.
- **Hasil:**
  - Data tersimpan langsung ke Google Sheets pada baris unit `JAK.117-08`.
  - Kartu unit `JAK.117-08` berubah menampilkan badge amber `⚠️ 3/2 Rit` dengan catatan peringatan oranye di bawahnya.
  - Seluruh armada lain tetap mempertahankan target `4/4 Rit` tanpa terganggu.

---

## 4. Status Quality Gates

- Unit Test: `pnpm vitest run src/` ➔ **24/24 Test Files PASSED, 207/207 Tests PASSED (100%)**.
- TypeScript Strict Mode & Build: `pnpm run build` ➔ **0 Error, Selesai dalam 980ms**.
- Knowledge Graph: `graphify update .` ➔ **Sinkron & Terbarukan**.
