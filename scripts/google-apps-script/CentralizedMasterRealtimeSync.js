/**
 * ===================================================================
 * SS_PDO - MASTER REALTIME SYNC (DYNAMIC SUPABASE SYNC)
 * ===================================================================
 * Arsitektur Jangka Panjang (Multi-Bulan & Dinamis):
 * 1. Skrip ini TIDAK meng-hardcode Spreadsheet ID di dalam kode.
 * 2. Daftar 18 spreadsheet rute aktif diambil LANGSUNG dari tabel
 *    'route_sheets' di Supabase REST API (Single Source of Truth).
 * 3. Ketika bulan berganti (misal Oktober -> November):
 *    - Skrip dapat memperbarui trigger otomatis setiap tanggal 1 (Scheduler).
 *    - ATAU cukup jalankan fungsi 'syncMonthlyTriggers()' sekali klik.
 * ===================================================================
 */

// 1. Konfigurasi Endpoint Supabase Resmi
const SUPABASE_URL = "https://sejttnsanzogsykmtwym.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlanR0bnNhbnpvZ3N5a210d3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MDg1MjUsImV4cCI6MjEwMTM4NDUyNX0.EIOBWlaLCornJo7IPFFfwitFoNiiZWBuP_wSmuXsmbk";
const WEBHOOK_URL = SUPABASE_URL + "/functions/v1/sheet-sync-webhook";

// 2. Durasi Debounce (Milidetik)
const DEBOUNCE_MS = 5000;

/**
 * UTILITY: Mengambil waktu saat ini dalam zona waktu Asia/Jakarta (WIB: UTC+7).
 */
function getWibDate() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (7 * 3600000));
}

/**
 * FUNGSI 1 (UTAMA): Sinkronisasi Trigger untuk Bulan Aktif
 * Jalankan fungsi ini untuk memperbarui trigger sesuai bulan yang sedang berjalan.
 * 
 * Alur Kerja:
 * 1. Mengambil tahun & bulan saat ini (WIB).
 * 2. Meminta daftar 18 spreadsheet ID aktif dari Supabase (route_sheets).
 * 3. Menyimpan pemetaan (sheetId -> routeCode) ke PropertiesService.
 * 4. Menghapus trigger usang dan memasang trigger baru ke 18 spreadsheet.
 */
function syncMonthlyTriggers() {
  const wib = getWibDate();
  const year = wib.getFullYear();
  const month = wib.getMonth() + 1; // 1-12

  syncTriggersForPeriod(year, month);
}

/**
 * FUNGSI 2: Sinkronisasi Trigger untuk Periode Tertentu
 * Contoh pemanggilan manual: syncTriggersForPeriod(2026, 11) untuk bulan November.
 */
function syncTriggersForPeriod(year, month) {
  Logger.log("=== Memulai Sinkronisasi Trigger untuk Periode: " + year + " Bulan: " + month + " ===");

  // 1. Ambil data rute aktif dari Supabase
  const routes = fetchActiveRoutesFromSupabase(year, month);
  if (!routes || routes.length === 0) {
    Logger.log("[PERINGATAN] Tidak ada spreadsheet rute yang ditemukan di Supabase untuk periode " + year + "-" + month);
    Logger.log("Pastikan admin sudah mendaftarkan spreadsheet bulan tersebut di aplikasi SS_PDO.");
    return;
  }

  Logger.log("Ditemukan " + routes.length + " rute terdaftar di Supabase.");

  // 2. Simpan pemetaan sheetId -> routeCode ke PropertiesService agar pencarian event sangat cepat (0ms)
  const scriptProperties = PropertiesService.getScriptProperties();
  const mappings = {};
  for (let i = 0; i < routes.length; i++) {
    mappings[routes[i].sheetId] = routes[i].routeCode;
  }
  mappings["ACTIVE_PERIOD_YEAR"] = String(year);
  mappings["ACTIVE_PERIOD_MONTH"] = String(month);
  scriptProperties.setProperties(mappings, true); // true = timpa konfigurasi lama

  // 3. Bersihkan trigger lama dalam project ini
  const existingTriggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < existingTriggers.length; i++) {
    // Hanya hapus trigger edit spreadsheet, pertahankan time-driven trigger jika ada
    if (existingTriggers[i].getHandlerFunction() === "handleMultiSheetEdit") {
      ScriptApp.deleteTrigger(existingTriggers[i]);
    }
  }
  Logger.log("Trigger edit lama berhasil dibersihkan.");

  // 4. Pasang trigger baru ke spreadsheet aktif
  let successCount = 0;
  for (let i = 0; i < routes.length; i++) {
    const item = routes[i];
    try {
      const ss = SpreadsheetApp.openById(item.sheetId);
      ScriptApp.newTrigger("handleMultiSheetEdit")
        .forSpreadsheet(ss)
        .onEdit()
        .create();
      successCount++;
      Logger.log("[" + successCount + "/" + routes.length + "] Berhasil memasang trigger: " + item.routeCode + " (" + item.sheetId + ")");
    } catch (err) {
      Logger.log("[GAGAL] Rute " + item.routeCode + " (" + item.sheetId + "): " + err.message);
    }
  }

  Logger.log("=== SELESAI! Berhasil mengaktifkan " + successCount + " trigger pemantau untuk periode " + year + "-" + month + " ===");
}

/**
 * FUNGSI 3: Mengambil Daftar Rute Aktif dari Supabase REST API (Single Source of Truth)
 */
function fetchActiveRoutesFromSupabase(year, month) {
  const url = SUPABASE_URL + "/rest/v1/route_sheets?select=spreadsheet_id,year,month,routes(route_code)&year=eq." + year + "&month=eq." + month;

  const options = {
    method: "get",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      Logger.log("Gagal memanggil Supabase REST API. Kode: " + response.getResponseCode() + " | Body: " + response.getContentText());
      return [];
    }

    const data = JSON.parse(response.getContentText());
    const result = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const routeCode = row.routes && row.routes.route_code ? row.routes.route_code : "";
      if (row.spreadsheet_id && routeCode) {
        result.push({
          routeCode: routeCode,
          sheetId: row.spreadsheet_id,
          year: row.year,
          month: row.month
        });
      }
    }
    return result;
  } catch (err) {
    Logger.log("Error fetchActiveRoutesFromSupabase: " + err.message);
    return [];
  }
}

/**
 * FUNGSI 4: Pasang Jadwal Otomatis Bulanan (CUKUP JALANKAN SEKALI)
 * Menjadwalkan fungsi 'syncMonthlyTriggers' agar otomatis berjalan pada tanggal 1 setiap bulan
 * pukul 01:00 dini hari WIB.
 */
function setupMonthlyAutomation() {
  // Hapus scheduler lama jika ada
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "syncMonthlyTriggers") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Buat pemicu waktu bulanan setiap tanggal 1 jam 1 pagi
  ScriptApp.newTrigger("syncMonthlyTriggers")
    .timeBased()
    .onMonthDay(1)
    .atHour(1)
    .create();

  Logger.log("Otomatisasi bulanan berhasil dipasang! Skrip akan otomatis sinkron setiap tanggal 1 jam 01:00.");
}

/**
 * FUNGSI 5: Pemeriksa Status Trigger Aktif
 */
function checkInstalledTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  const props = PropertiesService.getScriptProperties().getProperties();
  const year = props["ACTIVE_PERIOD_YEAR"] || "-";
  const month = props["ACTIVE_PERIOD_MONTH"] || "-";

  Logger.log("Periode Terdaftar: " + year + " Bulan: " + month);
  Logger.log("Total Trigger Aktif: " + triggers.length);

  for (let i = 0; i < triggers.length; i++) {
    const t = triggers[i];
    Logger.log((i + 1) + ". Handler: " + t.getHandlerFunction() + " | Type: " + t.getEventType() + " | Source: " + t.getTriggerSourceId());
  }
}

/**
 * FUNGSI 6: Handler Event Edit Otomatis dari Spreadsheet
 * Dipanggil oleh Google server setiap ada sel yang diedit di salah satu dari 18 sheet aktif.
 */
function handleMultiSheetEdit(e) {
  if (!e || !e.source || !e.range) return;

  const ss = e.source;
  const sheetId = ss.getId();
  const sheet = e.range.getSheet();
  const tabName = sheet.getName().trim();

  // Hanya proses jika tab adalah tanggal angka (1 s/d 31)
  if (!/^\d{1,2}$/.test(tabName)) return;

  // Cari kode rute dari PropertiesService (pencarian instan 0ms)
  const scriptProps = PropertiesService.getScriptProperties();
  let routeCode = scriptProps.getProperty(sheetId);

  // Fallback jika belum tersimpan di properties
  if (!routeCode) {
    const wib = getWibDate();
    const routes = fetchActiveRoutesFromSupabase(wib.getFullYear(), wib.getMonth() + 1);
    const match = routes.find(function(r) { return r.sheetId === sheetId; });
    if (match) {
      routeCode = match.routeCode;
      scriptProps.setProperty(sheetId, routeCode);
    }
  }

  if (!routeCode) return;

  // Debounce dengan ScriptCache untuk meredam ketikan beruntun
  const cache = CacheService.getScriptCache();
  const cacheKey = "SYNC_" + sheetId + "_" + tabName;
  const now = new Date().getTime();
  cache.put(cacheKey, now.toString(), 60);

  Utilities.sleep(DEBOUNCE_MS);

  const lastTime = cache.get(cacheKey);
  if (lastTime && now.toString() !== lastTime) {
    return; // Ada ketikan lebih baru yang masuk selama sleep
  }
  cache.remove(cacheKey);

  // Susun payload webhook resmi
  const payload = {
    routeCode: routeCode,
    spreadsheetId: sheetId,
    tabName: tabName,
    source: "google_sheets_on_edit"
  };

  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    Logger.log("Sync terkirim untuk " + routeCode + " tab " + tabName + " | Res: " + response.getResponseCode());
  } catch (err) {
    Logger.log("Gagal mengirim webhook sync: " + err.message);
  }
}
