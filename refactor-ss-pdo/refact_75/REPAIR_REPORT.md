# Repair Report - Refactor 75

Laporan implementasi pergeseran posisi tab Dashboard ke posisi tengah pada bilah navigasi bawah (*Bottom Navigation*) Monitoring Wilayah.

---

## 1. Ringkasan Perubahan

1. **Monitoring Bottom Nav (`src/components/monitoring/MonitoringBottomNav.tsx`):**
   * Menyusun ulang array `NAV_ITEMS` dari urutan lama:
     `[dashboard, routes, fleet_status, wa_report]`
     menjadi urutan baru yang simetris dan berpusat pada dashboard:
     `[routes, fleet_status, dashboard, wa_report]`
   * Ditambah tombol Profil di ujung kanan bar, susunan lengkap menjadi:
     1. **Rute** (`routes`)
     2. **Status Armada** (`fleet_status`)
     3. **Dashboard** (`dashboard`) — **TENGAH (Center Focal Point)**
     4. **Laporan WA** (`wa_report`)
     5. **Profil** (`profile`)

2. **Unit Tests (`src/components/monitoring/MonitoringBottomNav.test.tsx`):**
   * Menambahkan asersi eksplisit untuk memverifikasi bahwa tombol Dashboard berada tepat di indeks ke-2 (tengah dari 5 tombol):
     ```ts
     expect(buttons[0].getAttribute("data-testid")).toBe("monitoring-tab-routes");
     expect(buttons[1].getAttribute("data-testid")).toBe("monitoring-tab-fleet_status");
     expect(buttons[2].getAttribute("data-testid")).toBe("monitoring-tab-dashboard"); // CENTER!
     expect(buttons[3].getAttribute("data-testid")).toBe("monitoring-tab-wa_report");
     expect(buttons[4].getAttribute("data-testid")).toBe("monitoring-tab-profile");
     ```

---

## 2. Before vs After

* **Before (Urutan Lama):**
  ```text
  [ Dashboard ]  [ Rute ]  [ Status Armada ]  [ Laporan WA ]  [ Profil ]
     (Slot 1)     (Slot 2)      (Slot 3)         (Slot 4)      (Slot 5)
  ```
  *Kelemahan:* Tab Dashboard yang menjadi beranda aplikasi berada di tepi paling kiri, sehingga secara estetika dan ergonomis kurang seimbang di genggaman dua tangan.

* **After (Urutan Baru):**
  ```text
  [ Rute ]  [ Status Armada ]  [ Dashboard ]  [ Laporan WA ]  [ Profil ]
  (Slot 1)     (Slot 2)          (Slot 3)        (Slot 4)      (Slot 5)
                                 ▲ TENGAH ▲
  ```
  *Kelebihan:* 
  * Sisi kiri (Slot 1 & 2) memuat tab pengawasan lapangan langsung (*Operasional Unit & Rute*).
  * Sisi tengah (Slot 3) memuat tab Dashboard sebagai jangkar komando (*Executive Center*).
  * Sisi kanan (Slot 4 & 5) memuat tab keluaran dan preferensi (*Distribusi Laporan WA & Pengaturan Akun*).

---

## 3. Case: Skenario Lapangan

* **Skenario:** Supervisor atau Korwil sedang memverifikasi rute di tab "Rute" atau memeriksa unit bus di tab "Status Armada".
* **Kebutuhan:** Setelah selesai memeriksa armada, supervisor ingin cepat kembali melihat gambaran makro pencapaian pelanggan hari ini.
* **Pengalaman Baru:** Dengan posisi Dashboard tepat di tengah bilah navigasi bawah, jempol tangan (baik tangan kanan maupun tangan kiri) dapat dengan sangat natural dan cepat menekan ikon Dashboard di tengah tanpa harus meregangkan jari ke sudut kiri layar.

---

## 4. Status Quality Gates

- [x] `pnpm vitest run src/components/monitoring/MonitoringBottomNav.test.tsx` ➔ **5 passed**
- [x] `pnpm vitest run src/components/monitoring/` ➔ **7 test files, 32 passed (100%)**
- [x] `pnpm run build` ➔ **TypeScript & Vite build Success (0 error)**
