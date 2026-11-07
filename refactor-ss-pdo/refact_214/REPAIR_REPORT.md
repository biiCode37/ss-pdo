# REPAIR REPORT: REFACTOR 214
**Modul:** Penjaga otomatis utang tampilan UI & aturan konsistensi untuk AI agent
**Tanggal:** 07 November 2026
**Status:** Selesai — 4 quality gate lulus

---

## 1. Implementasi Perbaikan

### A. Test ratchet utang UI (`src/styles/ui-debt-ratchet.test.ts`, baru)
- Memindai semua `.tsx`, `.ts`, `.css` di `src/` (kecuali file test, `src/styles/tokens/`, dan `src/utils/sheetColorUtils.ts`).
- Mengukur 12 metrik: `rawHexColor`, `rgbHslFunction`, `gradient`, `gradientText`, `inlineStyleObject`, `fontSizeBelow12px`, `fontSizeOffScale` (skala 12/13/14/16/18/20/24/28 px; `rem` dikonversi ×16), `fontWeightHeavy` (800/900), `iconSizeOffScale` (skala 16/20/24), `legacyAccentColor`, `textShadow`, `backdropFilter`.
- Setiap metrik dibandingkan dengan `BASELINE`: naik → gagal dengan pesan "perbaiki kode, jangan naikkan baseline"; turun → gagal dengan pesan "turunkan baseline ke angka baru" agar perbaikan terkunci.
- Test sanity memastikan pemindai benar-benar membaca lebih dari 100 file.

### B. Aturan konsistensi UI (`.agents/rules/ui-consistency.md`, baru)
- 11 bagian: pakai ulang komponen, cara menulis gaya, fokus & interaksi, warna & efek, tipografi (skala sementara), ikon, isi & teks bantuan, tata letak & jarak (skala sementara), penjaga otomatis, proses perubahan visual, checklist.
- Ukuran ±6 KB agar tetap di bawah batas panjang file aturan Antigravity yang dilaporkan (±12.000 karakter).

### C. Rujukan di file aturan yang ada
- `AGENTS.md`: bagian baru "Standar Konsistensi Tampilan UI (Anti-Slop)" berisi 8 poin ringkas + tautan ke aturan lengkap.
- `GEMINI.md` dan `.agents/AGENTS.md`: satu poin rujukan wajib ke `.agents/rules/ui-consistency.md`.

## 2. Before vs After

| Aspek | Before | After |
|---|---|---|
| Aturan tata letak, tipografi, ikon, efek | Tidak ada | `.agents/rules/ui-consistency.md` (11 bagian) |
| Pelanggaran visual baru oleh agent | Lolos tanpa terdeteksi | Test gagal pada metrik yang naik |
| Perbaikan utang UI | Bisa kembali memburuk tanpa jejak | Baseline wajib diturunkan, perbaikan terkunci |
| Aturan untuk Antigravity | Hanya di file panjang (±20–27 ribu karakter) | File pendek di `.agents/rules/` + rujukan di 3 file aturan |
| Visibilitas utang UI | Tidak terukur | 12 angka baseline terdokumentasi |

Baseline per 07 November 2026: hex 837, rgb/hsl 972, gradasi 28, teks bergradasi 6, inline style 2.013, huruf < 12px 386, huruf di luar skala 619, bobot 800+ 106, ikon di luar skala 274, aksen warisan 264, text-shadow 0, backdrop-filter 34.

## 3. Case: Skenario Lapangan

### Case BUG-UIDEBT-214-01: Agent menambah kartu baru dengan gaya acak
- **Situasi:** Agent lain diminta menambah kartu ringkasan di dashboard, lalu menulis `style={{ background: "linear-gradient(...)", fontSize: "10.5px", color: "#3ECF8E" }}` dengan ikon `size={13}`.
- **Before:** Kode lolos semua test; tampilan bertambah tidak konsisten (gradasi, teks terlalu kecil, hijau di luar palet).
- **After:** `pnpm vitest run src/` gagal pada metrik `gradient`, `rawHexColor`, `fontSizeBelow12px`, `legacyAccentColor`, `iconSizeOffScale`, dll., dengan pesan yang menunjuk ke aturan. Agent harus memperbaiki kode sebelum quality gate lulus.

### Case BUG-UIDEBT-214-02: Antigravity memulai sesi baru
- **Situasi:** Antigravity membuka proyek dan memuat aturan workspace.
- **Before:** Aturan tampilan tidak ada; aturan lain berada di file panjang yang berisiko terpotong.
- **After:** Aturan tampilan dimuat dari file pendek di `.agents/rules/`, dan dirujuk juga dari `AGENTS.md`, `GEMINI.md`, `.agents/AGENTS.md`. Jika aturan tetap terlewat, test ratchet yang menahan.

## 4. Verifikasi

1. `pnpm vitest run src/styles/tokens/color-contract.test.ts` — **158/158 test lulus**.
2. `pnpm vitest run src/` — **142 file, 1356/1356 test lulus** (termasuk 13 test ratchet baru).
3. `pnpm run build` — **exit 0**.
4. `graphify update .` — 7952 node, 13562 edge, 643 komunitas.

Uji penangkapan: file sementara `src/components/RatchetProbe.tsx` berisi hex `#3ECF8E`, `rgba()`, `linear-gradient`, `fontSize: "10.5px"`, `fontWeight: 800`, `backdropFilter`, `textShadow`, dan ikon `size={13}` → test ratchet gagal pada **11 metrik** (semua yang dipicu file uji). Setelah file dihapus, 13/13 test lulus kembali.

Keterbatasan yang disadari:
- Ratchet menghitung total proyek: pelanggaran baru bisa "tersembunyi" bila pada saat yang sama ada pelanggaran lain yang dihapus. Diff `BASELINE` tetap terlihat saat review.
- Pemindaian berbasis regex: ukuran huruf lewat variabel/template literal dan ikon dengan `size` dinamis tidak terhitung.
- Batas ±12.000 karakter file aturan Antigravity berasal dari sumber pihak ketiga dan belum diverifikasi langsung.
