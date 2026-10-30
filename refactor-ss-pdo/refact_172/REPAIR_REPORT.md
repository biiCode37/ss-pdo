# Repair Report: Refactor 172 — Penyempurnaan Form Input Keterangan Bus: Multi-Select Presets, OKB Hijau, & Tombol Reset

## Ringkasan Perbaikan
Refactor 172 menuntaskan penyempurnaan form input catatan/keterangan armada bus, mencakup:
1. **Pipeline Token Multi-Select Non-Destruktif:**
   Mengganti logika string replacement kaku dengan arsitektur parsing token (`extractKeteranganTokens` dan `formatKeteranganTokens`). Seluruh tombol preset (`BA.01/BA.02`, `OFF`, `TO EVDAL`, `OKB`, `Renop`) kini dapat diaktifkan bersamaan (multi-select) tanpa menghapus catatan bebas pengguna.
2. **Standardisasi Warna Tombol OKB (Hijau):**
   Mengubah warna aktif tombol `[OKB]` dari ungu (`#a855f7`) menjadi **HIJAU** (`#10b981`), mempertegas semantik operasional bahwa armada kembali beroperasi / jalan melayani pelanggan.
3. **Penyediaan Tombol Reset Cepat (One-Tap Reset):**
   Menambahkan tombol `[Reset]` dengan ikon putar balik (`<RotateCcw size={12} />`) yang secara instan mengosongkan textarea dan menonaktifkan seluruh preset aktif.
4. **Pemberian Trailing Space Otomatis pada BA:**
   Menjamin saat tombol `BA` ditekan, kursor teks siap menerima pengetikan alasan tanpa perlu menekan tombol spasi manual.
5. **Kepatuhan Kamus Teks Sentral (Anti Hardcoded String):**
   Seluruh teks baru (`Reset` dan deskripsi tooltip) bersumber dari `src/constants/texts/text_alerts.ts`.

---

## Implementasi Kode

### 1. Ekstraksi & Formatter Token (`src/utils/keteranganUtils.ts`)
```typescript
export interface KeteranganMultiTokens {
  isOkb: boolean;
  isRenop: boolean;
  baCode: string | null; // "BA.01" | "BA.02" | dst.
  isOff: boolean;
  isToEvdal: boolean;
  detail: string;
}

export function extractKeteranganTokens(raw?: string | null): KeteranganMultiTokens {
  // Mengekstrak status tag lifecycle & insiden secara independen
  // dan mengisolasi detail teks bebas murni tanpa prefix duplikat.
}

export function formatKeteranganTokens(tokens: KeteranganMultiTokens): string {
  // Merangkai token secara harmonis dan terstandarisasi:
  // Lifecycle (OKB / Renop) -> Kode Insiden (BA / OFF / TO EVDAL) -> Detail Alasan Bebas
  // Contoh: "OKB - BA.02 NP1", "OKB - Pramudi Sakit", "Renop - BA.01 Pintu Macet"
}
```

### 2. Multi-Select Preset Handlers (`src/components/busCard/modal/notes/KeteranganPresetBar.tsx`)
```tsx
// Handler OKB: Toggle on/off tanpa menghilangkan detail atau tag lain
const handleToggleOkb = () => {
  const currentTokens = extractKeteranganTokens(value);
  const nextTokens: KeteranganMultiTokens = {
    ...currentTokens,
    isOkb: !currentTokens.isOkb,
    isRenop: !currentTokens.isOkb ? false : currentTokens.isRenop,
  };
  onChange(formatKeteranganTokens(nextTokens));
};

// Tombol OKB dengan style HIJAU
<button
  type="button"
  onClick={handleToggleOkb}
  style={{
    ...pillBaseStyle,
    border: isOkbActive ? "1px solid #10b981" : "1px solid rgba(148, 163, 184, 0.25)",
    background: isOkbActive ? "rgba(16, 185, 129, 0.2)" : "rgba(148, 163, 184, 0.08)",
    color: isOkbActive ? "#10b981" : "var(--color-text-secondary, #94a3b8)",
    fontWeight: isOkbActive ? 700 : 500,
  }}
>
  OKB
</button>
```

### 3. Tombol Reset Sekali Sentuh
```tsx
<button
  type="button"
  data-testid="reset-keterangan-btn"
  onClick={() => onChange("")}
  disabled={!hasText}
  title={TEXT_ALERTS.RESET_TOOLTIP}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    border: "1px solid rgba(239, 68, 68, 0.25)",
    background: hasText ? "rgba(239, 68, 68, 0.12)" : "transparent",
    color: hasText ? "#ef4444" : "var(--color-text-muted, #64748b)",
    opacity: hasText ? 1 : 0.4,
    cursor: hasText ? "pointer" : "not-allowed",
  }}
>
  <RotateCcw size={12} />
  <span>{TEXT_ALERTS.BTN_RESET}</span>
</button>
```

---

## Before vs After

| Aspek | Sebelum Perbaikan (Before) | Sesudah Perbaikan (After) |
|---|---|---|
| **Interaksi Tombol Preset** | Single-value replace kaku. Menekan tombol preset menghapus teks alasan atau tag lain. | **Multi-Select non-destruktif**. Setiap preset dapat diaktifkan/dimatikan bebas berdampingan dengan catatan bebas. |
| **Warna Tombol OKB** | Ungu (`#a855f7`), rancu dengan indikator masalah kendala armada/SO. | **Hijau (`#10b981`)**, selaras secara semantik dengan status armada jalan / beroperasi normal. |
| **Pembersihan Teks Form** | Manual menekan backspace berulang kali di keyboard ponsel kecil. | **Satu tombol `[Reset]`** (`RotateCcw`), otomatis nonaktif saat kosong dan instan bersih saat ditekan. |
| **Ketik Alasan Setelah BA** | `BA.01` menempel tanpa spasi. Kursor langsung rapat di angka terakhir. | **Otomatis diberi spasi di akhir** (`BA.01 ` / `BA.02 `), siap langsung mengetikkan alasan. |
| **Standarisasi Kamus Teks** | Teks tombol/tooltip berisiko hardcoded di JSX. | Terpusat di `src/constants/texts/text_alerts.ts` (`BTN_RESET`, `RESET_TOOLTIP`). |

---

## Case: Skenario Lapangan

### Skenario 1: Armada NP1 di Shift 1, OKB di Shift 2, lalu Supir Sakit di Pertengahan Shift 2
- **Latar Belakang Kasus:**
  Unit bus JAK.87-003 mengalami kendala tidak siap jalan (NP1) pada Shift 1. Pada awal Shift 2 unit berhasil dioperasikan kembali (OKB). Namun menjelang sore supir mengeluh sakit mendadak sehingga bus harus berhenti operasi.
- **Tindakan Petugas Lapangan:**
  1. Petugas menekan tombol `[OKB]` (tombol menyala hijau, teks: `OKB`).
  2. Petugas mengetik: `Pramudi Sakit` (teks otomatis menjadi: `OKB - Pramudi Sakit`).
  3. Atau jika pengawas mengeluarkan Berita Acara `BA.02`, petugas tinggal menekan tombol `[BA]` (teks menjadi: `OKB - BA.02 Pramudi Sakit`).
- **Hasil Sistem:**
  Catatan tersimpan utuh: `OKB - BA.02 Pramudi Sakit`. Riwayat OKB tidak hilang, nomor BA tersimpan, dan alasan spesifik tidak terhapus.

### Skenario 2: Armada Mengalami Kerusakan Teknis di Lapangan dan Masuk Renop
- **Latar Belakang Kasus:**
  Unit JAK.87-001 mengalami pintu penumpang macet dan dialihkan masuk ke jadwal Renop.
- **Tindakan Petugas Lapangan:**
  1. Petugas menekan tombol `[Renop]` (tombol menyala biru).
  2. Petugas menekan tombol `[BA]` (teks menjadi: `Renop - BA.01 `).
  3. Petugas melanjutkan mengetik alasan: `Pintu Rusak`.
- **Hasil Sistem:**
  Teks tersusun rapi: `Renop - BA.01 Pintu Rusak`.

### Skenario 3: Batal Input / Koreksi Menyeluruh Catatan Bus
- **Latar Belakang Kasus:**
  Petugas salah memilih unit bus dan ingin mengosongkan seluruh kolom catatan yang panjang tanpa repot menghapus satu per satu huruf di layar smartphone.
- **Tindakan Petugas Lapangan:**
  1. Petugas menekan tombol merah `[Reset]` di pojok kanan preset bar.
- **Hasil Sistem:**
  Textarea instan kosong bersih (`""`), seluruh tombol preset mati kembali ke status netral, dan tombol Reset menjadi disable.
