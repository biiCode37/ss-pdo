# Audit Temuan Lonjakan Kuota & Infinite Loop Monitoring - Refactor 193

Dokumen ini mencatat audit mendalam terhadap anomali lonjakan kuota Supabase (618.000+ request API Gateway dan 12.1 GB Egress dalam 24 jam dengan 2 MAU) yang memicu peringatan *Exceeding Usage Limits* dan *Grace Period* pada proyek **SS_PDO**.

---

## Ringkasan Temuan Audit

| ID Temuan | Lokasi Kode | Kategori | Keparahan | Deskripsi & Dampak Pengguna/Sistem | Mitigasi |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-193-01** | `src/components/monitoring/AllRouteMonitoringPage.tsx` | React Performance / Infinite Loop | 🔴 **Critical** | **Infinite Re-render Loop pada `loadData`:** State `data` dimasukkan ke dalam dependency array `useCallback` fungsi `loadData`, padahal `loadData` sendiri memanggil `setData(regionalRes)`. Setiap kali fetch selesai, referensi `loadData` berubah sehingga memicu `useEffect([loadData])` kembali tanpa henti (0 ms delay).<br><br>*Dampak:* 2 user menghasilkan ~618.000 request API Gateway dan membakar 12.1 GB Egress dalam 24 jam. HP/tablet pengawas cepat panas, baterai terkuras, kuota seluler boros, dan akun Supabase terancam terblokir (HTTP 402). | 1. Gunakan `dataRef = useRef(data)` untuk membaca ketersediaan data di memori tanpa memicu re-creation fungsi.<br>2. Hapus `data` dari dependency array `useCallback` (hanya `[selectedDate, currentPeriod]`).<br>3. Pasang *in-flight guard* (`isFetchingRef`) agar request yang sedang berjalan tidak tumpang tindih (*overlapping*). |
| **BUG-193-02** | `src/components/monitoring/AllRouteMonitoringPage.tsx` | Realtime Event Throttling | 🟠 **High** | **Un-debounced Realtime Listener Cascading Spike:** Listener Supabase Realtime (`postgres_changes` pada tabel `daily_route_reports`) langsung memanggil `loadDataRef.current?.("silent")` untuk setiap event individual. Saat pergantian shift atau batch edit spreadsheet di lapangan (Google Apps Script / Webhook), puluhan sinyal realtime masuk dalam hitungan detik dan memicu badai query massal secara bersamaan.<br><br>*Dampak:* Layar dashboard monitoring pengawas berkedip/flicker berulang kali dan membebani instance Supabase secara drastis. | Bungkus callback event realtime dengan *debounce timer* 3.000 ms (3 detik) serta pastikan timer dibersihkan (`clearTimeout`) saat komponen di-unmount. |
