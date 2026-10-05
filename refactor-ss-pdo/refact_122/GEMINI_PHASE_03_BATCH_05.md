# Instruksi untuk Gemini — Fase 3 Batch 3.5: Shell Modal Bus

Keputusan Codex: Batch 3.4 **PASS**. Kerjakan **hanya Batch 3.5**, lalu berhenti pada `READY_FOR_REVIEW`.

## Tujuan

Migrasikan shell `src/components/busCard/BusInputModal.tsx` dari portal, listener Escape, dan `document.body.style.overflow` buatan sendiri ke `src/components/ui/ModalShell.tsx`. Gunakan scroll lock dan stack dismissal yang sudah dikoordinasikan oleh `ModalShell`. Pertahankan perilaku form serta layout mobile.

## Kondisi awal yang perlu diperhatikan

- `BusInputModal` saat ini memakai `createPortal`, listener Escape global, scroll lock langsung, animasi keluar `220ms`, `useVisualViewport`, kontainer form dengan scroll internal, dan footer tetap di bawah.
- `ModalShell` sudah menyediakan portal, scroll lock reference counting, Escape topmost, Android Back, backdrop, focus trap/restoration, `aria-labelledby`, serta `backdropStyle`/`contentStyle` dan kelas kustom. Pakai API ini tanpa membuat koordinator atau modal wrapper baru.
- `useBusInputForm` menerima `onDismiss`, `isOpen`, dan `isMounted`; jaga kontraknya. `onSave`/offline queue, validasi, payload, Single Focus, dan tab tidak boleh berubah semantik.
- Lihat relasi komponen di `graphify-out/GRAPH_REPORT.md` dan source sebelum mengedit. R80-10 global tetap PARTIAL untuk modal lain.

## Pekerjaan wajib

1. Hapus listener Escape, portal, dan pengaturan `body.style.overflow` lokal dari Bus Input. Sambungkan seluruh jalur tutup (header, footer, backdrop, Escape, Back) ke satu `handleDismiss` yang idempotent dan tetap memberi animasi keluar sekitar 220 ms.
2. Kelola timer penutupan dan siklus buka/tutup dengan aman: tidak ada `onClose` ganda, callback terlambat setelah unmount, atau state `isClosing` tertinggal saat modal dibuka lagi. Jangan mengubah urutan `onSave` dan `onDismiss`.
3. Pertahankan geometri bottom sheet, transisi, backdrop blur, tinggi saat keyboard tampil, safe area, body scroll internal, dan footer yang terlihat ketika keyboard aktif. Jangan membuat dialog bersarang atau dua elemen `role="dialog"`.
4. Pakai `aria-labelledby` dari header/form ID yang sudah ada. Jaga fokus awal, siklus Tab/Shift+Tab, pengembalian fokus, dan urutan saat dialog lain berada di atas. Uji Escape dan Android Back dengan dialog bertumpuk; hanya yang teratas boleh ditutup.
5. Pertahankan seluruh teks UI melalui `src/constants/texts/`. Jika ada teks baru, tambah uji `src/constants/texts/texts.test.ts`. Istilah ritase berarti PP; trip satu arah tidak boleh ditampilkan sebagai ritase tanpa normalisasi.
6. Tetap sempit pada shell dan tes regresinya. Hindari refactor validasi, payload, hook odometer, atau membuat abstraksi generik baru kecuali diperlukan secara langsung untuk menjaga perilaku di atas.

## Gerbang bukti

- Tambah/perbarui tes yang benar-benar membuktikan close idempotent dengan timer 220 ms, Escape/Back topmost, scroll lock bertumpuk dan pemulihannya, fokus, serta form/scroll/footer tetap berfungsi. Jangan hanya menguji detail implementasi.
- Jalankan tes target, seluruh `src/`, TypeScript, lint terarah, dan build PWA. Jalankan `graphify update .` setelah perubahan kode; catat hasil dan noise yang relevan.
- Periksa Light/Dark pada viewport ponsel dan keyboard/scroll secara visual bila browser tersedia. Bila tidak, catat keterbatasan secara jujur dan berikan bukti DOM/CSS yang dapat diverifikasi.
- Buat folder urutan **baru setelah `refact_122`** dengan `AUDIT_BUGS.md`, `REPAIR_REPORT.md`, bukti command; sertakan **Before vs After** dan **Case: Skenario Lapangan**. Jangan mengedit folder audit yang telah selesai.
- Seluruh kerja hanya di branch `devmode`; jangan reset, stash, clean, commit, push, atau menyentuh branch utama. Pertahankan perubahan lokal dan arsip yang ada.

Kirim status `READY_FOR_REVIEW` beserta path folder dan ringkasan hasil. Jangan mulai fase berikutnya sebelum keputusan review Codex.
