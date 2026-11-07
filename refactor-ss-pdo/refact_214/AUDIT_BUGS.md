# AUDIT TEMUAN UTANG TAMPILAN UI & PENEGAKAN ATURAN: REFACTOR 214
**Modul:** Seluruh kode UI di `src/` (`.tsx`, `.ts`, `.css`, kecuali token primitif dan `sheetColorUtils.ts`), file aturan agent (`AGENTS.md`, `GEMINI.md`, `.agents/AGENTS.md`, `.agents/rules/`).
**Fokus Masalah:** Tampilan tidak konsisten karena AI agent (termasuk Antigravity) terus menambah warna mentah, gradasi, inline style, ukuran huruf/ikon acak, dan efek glow. Aturan teks yang ada tidak ditegakkan oleh test, sehingga pelanggaran baru tidak terdeteksi.

---

### ID Temuan: BUG-UIDEBT-214-01
- **Lokasi Kode:** `src/**/*.tsx`, `src/**/*.ts`, `src/**/*.css` (lintas modul)
- **Keparahan:** High (sumber utama tampilan berantakan; terus bertambah di setiap fitur baru)
- **Deskripsi:** Hasil pengukuran 07 November 2026: 837 kode hex mentah, 972 fungsi `rgb()/rgba()/hsl()`, 28 gradasi (6 di antaranya teks bergradasi), 2.013 objek `style={{}}` inline, 386 ukuran huruf di bawah 12px, 619 ukuran huruf di luar skala, 106 bobot huruf 800+, 274 ukuran ikon di luar 16/20/24, 264 pemakaian warna aksen warisan (`--accent-color`, `#3ECF8E`, `#24B47E`), 34 `backdrop-filter`.
- **Dampak User:** Warna, ukuran huruf, dan ikon berbeda-beda antar halaman; teks kecil (8–11px) sulit dibaca di lapangan; kesan "tidak rapi" dan tidak profesional.
- **Mitigasi:** Test ratchet `src/styles/ui-debt-ratchet.test.ts` yang mengunci jumlah saat ini sebagai batas atas. Angka naik → gagal; angka turun → wajib menurunkan baseline sehingga perbaikan terkunci.

### ID Temuan: BUG-UIDEBT-214-02
- **Lokasi Kode:** `AGENTS.md`, `GEMINI.md`, `.agents/AGENTS.md`
- **Keparahan:** Medium (aturan bisa tidak terbaca agent)
- **Deskripsi:** Tidak ada aturan khusus tata letak, tipografi, ikon, fokus, dan efek visual. File aturan yang ada panjang (`AGENTS.md` ±20.000 karakter, `.agents/AGENTS.md` ±27.000 karakter) dan sebagian isinya tumpang tindih. Panduan pihak ketiga melaporkan batas ±12.000 karakter per file aturan Antigravity (belum diverifikasi).
- **Dampak User:** Agent lain tidak punya acuan tampilan, atau bagian akhir aturan terpotong; hasilnya kesalahan visual yang sama terulang.
- **Mitigasi:** Aturan lengkap di file pendek `.agents/rules/ui-consistency.md` (lokasi aturan workspace resmi Antigravity), dirujuk dari ketiga file aturan, dan ditegakkan oleh test ratchet serta `focus-ring.test.ts`.
