/**
 * ============================================================================
 * REALTIME SINKRONISASI GOOGLE SHEETS KE SUPABASE (SS_PDO MONITORING)
 * ============================================================================
 * 
 * Deskripsi:
 * Skrip ini dipasang pada file Google Sheets masing-masing rute (18 rute).
 * Ketika petugas mengedit/mengisi data bus pada sheet tanggal harian, skrip ini
 * akan memicu webhook Supabase Edge Function secara realtime.
 * 
 * Arsitektur Keamanan (Zero-Secret):
 * - Skrip ini TIDAK MEMBUTUHKAN token rahasia, API key, atau password.
 * - Endpoint Supabase memvalidasi keaslian rute dan membaca sheet resmi
 *   menggunakan kredensial server (Google Service Account internal).
 */

// URL Webhook resmi Supabase Edge Function SS_PDO
var WEBHOOK_URL = "https://sejttnsanzogsykmtwym.supabase.co/functions/v1/sheet-sync-webhook";

// (OPSIONAL) Masukkan kode rute manual jika nama file spreadsheet Anda berbeda.
// Contoh: "JAK.60" atau "JAK 120".
// Jika dibiarkan kosong "", skrip akan otomatis mendeteksi dari nama file spreadsheet!
var EXPLICIT_ROUTE_CODE = "";

// Waktu tunggu debounce (detik) untuk mencegah spam request saat petugas mengetik beruntun
var DEBOUNCE_SECONDS = 5;

/**
 * Fungsi pembantu untuk mendeteksi kode rute dari nama file spreadsheet
 */
function getTargetRouteCode() {
  if (EXPLICIT_ROUTE_CODE && EXPLICIT_ROUTE_CODE.trim() !== "") {
    return EXPLICIT_ROUTE_CODE.trim().toUpperCase().replace(/\s+/g, ".");
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var fileName = ss.getName();
  
  // Mencari pola JAK xx atau JAK.xx (misal: "JAK 60", "JAK.120", "JAK 10A")
  var match = fileName.match(/JAK[\s\.\-_]*([A-Z0-9]+)/i);
  if (match) {
    return "JAK." + match[1].toUpperCase();
  }
  
  // Jika tidak ditemukan pola JAK, kembalikan nama sheet bersih
  return fileName.trim();
}

/**
 * Fungsi pembantu untuk mendapatkan tanggal target dari nama sheet aktif
 */
function getTargetDateFromSheet(sheetName) {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1; // 1-12
  var day = now.getDate();
  
  // Jika nama tab adalah angka 1 - 31 (tab tanggal harian)
  var parsedDay = parseInt(sheetName, 10);
  if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
    day = parsedDay;
  }
  
  var mStr = month < 10 ? "0" + month : "" + month;
  var dStr = day < 10 ? "0" + day : "" + day;
  return year + "-" + mStr + "-" + dStr;
}

/**
 * FUNGSI UTAMA TRIGGER: Dipanggil otomatis oleh Installable Trigger saat ada perubahan
 */
function onSpreadsheetEditTrigger(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var activeSheet = ss.getActiveSheet();
    var sheetName = activeSheet.getName().trim();
    
    // Periksa apakah tab yang diedit adalah tab tanggal (angka 1-31)
    var isDateTab = /^[0-9]{1,2}$/.test(sheetName);
    if (!isDateTab) {
      Logger.log("Perubahan pada tab '" + sheetName + "' diabaikan (bukan tab tanggal harian).");
      return;
    }
    
    var routeCode = getTargetRouteCode();
    var targetDate = getTargetDateFromSheet(sheetName);
    
    // Debounce guard menggunakan CacheService agar tidak spamming webhook
    var cache = CacheService.getScriptCache();
    var cacheKey = "sync_lock_" + routeCode + "_" + targetDate;
    if (cache.get(cacheKey)) {
      Logger.log("Sinkronisasi ditunda (cooldown debounce aktif): " + routeCode + " " + targetDate);
      return;
    }
    cache.put(cacheKey, "locked", DEBOUNCE_SECONDS);
    
    Logger.log("Mengirim sinkronisasi realtime ke Supabase: " + routeCode + " (" + targetDate + ")");
    
    var payload = {
      routeCode: routeCode,
      date: targetDate
    };
    
    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();
    
    Logger.log("Hasil Webhook (" + responseCode + "): " + responseBody);
  } catch (err) {
    Logger.log("Gagal sinkronisasi realtime: " + err.toString());
  }
}

/**
 * FUNGSI UJI COBA MANUAL: Jalankan fungsi ini langsung dari editor Apps Script
 * untuk mengetes apakah koneksi ke Supabase berjalan dengan sukses.
 */
function testManualSync() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = ss.getActiveSheet().getName();
  var routeCode = getTargetRouteCode();
  var targetDate = getTargetDateFromSheet(sheetName);
  
  Logger.log("=== MEMULAI TEST KONEKSI REALTIME ===");
  Logger.log("File Spreadsheet: " + ss.getName());
  Logger.log("Deteksi Kode Rute: " + routeCode);
  Logger.log("Tab Aktif: " + sheetName);
  Logger.log("Target Tanggal: " + targetDate);
  Logger.log("Mengirim POST ke: " + WEBHOOK_URL);
  
  var payload = {
    routeCode: routeCode,
    date: targetDate
  };
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  var res = UrlFetchApp.fetch(WEBHOOK_URL, options);
  Logger.log("Response HTTP Code: " + res.getResponseCode());
  Logger.log("Response Body: " + res.getContentText());
  
  if (res.getResponseCode() === 200) {
    SpreadsheetApp.getUi().alert("✅ Sukses! Data rute " + routeCode + " berhasil tersinkronisasi ke Dashboard secara realtime.");
  } else {
    SpreadsheetApp.getUi().alert("⚠️ Webhook merespons (" + res.getResponseCode() + "): " + res.getContentText());
  }
}
