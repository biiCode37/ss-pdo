import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function base64UrlEncode(data: Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof data === "string") {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = data;
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function pemToBinary(pem: string): Uint8Array {
  const cleanPem = pem
    .replace(/\\n/g, "")
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  const binaryString = atob(cleanPem);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function extractFirstJsonObject(str: string): Record<string, unknown> {
  let braceCount = 0;
  let inString = false;
  let escaped = false;
  let startIndex = -1;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{") {
        if (braceCount === 0) startIndex = i;
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0 && startIndex !== -1) {
          const jsonSub = str.slice(startIndex, i + 1);
          return JSON.parse(jsonSub) as Record<string, unknown>;
        }
      }
    }
  }
  throw new Error("Objek JSON berimbang ({ ... }) tidak ditemukan");
}

function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  const rawKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY") || Deno.env.get("GSERVICEACCOUNT_KEY");
  if (!rawKey) return null;

  try {
    let text = rawKey.trim();
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
      try {
        const unquoted = JSON.parse(text);
        if (typeof unquoted === "string") text = unquoted.trim();
      } catch {
        text = text.slice(1, -1).trim();
      }
    }

    let parsed: Record<string, unknown>;
    if (text.includes("{")) {
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        parsed = extractFirstJsonObject(text);
      }
    } else {
      const decoded = atob(text);
      try {
        parsed = JSON.parse(decoded) as Record<string, unknown>;
      } catch {
        parsed = extractFirstJsonObject(decoded);
      }
    }

    if (
      typeof parsed.client_email === "string" &&
      typeof parsed.private_key === "string"
    ) {
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
        token_uri: (parsed.token_uri as string) || "https://oauth2.googleapis.com/token",
      };
    }
  } catch (err) {
    console.error("[SheetSyncWebhook] Gagal mem-parse kredensial Service Account:", err);
  }
  return null;
}

async function getGoogleAccessToken(creds: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - now > 180) {
    return cachedToken.accessToken;
  }

  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: creds.token_uri || "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const keyBuffer = pemToBinary(creds.private_key);
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer as unknown as BufferSource,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));
  const jwt = `${signatureInput}.${encodedSignature}`;

  const tokenParams = new URLSearchParams();
  tokenParams.set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  tokenParams.set("assertion", jwt);

  const tokenRes = await fetch(creds.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text();
    throw new Error(`Google OAuth2 Error (${tokenRes.status}): ${errorBody}`);
  }

  const tokenData = await tokenRes.json();
  const expiresIn = tokenData.expires_in || 3600;

  cachedToken = {
    accessToken: tokenData.access_token,
    expiresAt: now + expiresIn,
  };

  return cachedToken.accessToken;
}

function parseIndonesianNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  const str = String(value).trim();
  if (!str) return 0;
  const normalized = str.replace(/\s+/g, "").replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Hanya metode POST yang didukung" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawRouteCode = String(body.routeCode || "").trim();
    if (!rawRouteCode) {
      return new Response(JSON.stringify({ error: "routeCode wajib disertakan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalisasi kode rute (contoh: JAK 60 -> JAK.60)
    const normalizedCode = rawRouteCode.toUpperCase().replace(/\s+/g, ".");

    // Tentukan tanggal target (WIB)
    let targetDateStr = String(body.date || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
      // Ambil tanggal hari ini dalam zona waktu Asia/Jakarta (WIB: UTC+7)
      const now = new Date();
      const wibOffset = 7 * 60; // 7 jam
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const wibDate = new Date(utc + wibOffset * 60000);
      const y = wibDate.getFullYear();
      const m = String(wibDate.getMonth() + 1).padStart(2, "0");
      const d = String(wibDate.getDate()).padStart(2, "0");
      targetDateStr = `${y}-${m}-${d}`;
    }

    const [yStr, mStr, dStr] = targetDateStr.split("-");
    const targetYear = parseInt(yStr, 10);
    const targetMonth = parseInt(mStr, 10);
    const targetDay = parseInt(dStr, 10);
    const tabName = String(targetDay);

    // Inisialisasi Supabase internal client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Server Supabase tidak terkonfigurasi dengan benar" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verifikasi rute di database (Whitelist check)
    const { data: routeData, error: routeError } = await supabase
      .from("routes")
      .select("id, route_code, km_baku, default_renops, renops_weekday, renops_saturday, renops_sunday, renops_holiday")
      .or(`route_code.ilike.${normalizedCode},route_code.ilike.${normalizedCode.replace(/\./g, " ")}`)
      .limit(1)
      .maybeSingle();

    if (routeError || !routeData) {
      return new Response(JSON.stringify({ error: `Rute '${rawRouteCode}' tidak terdaftar di sistem` }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Ambil data laporan eksisting di Supabase (Safe Realtime Guard)
    const { data: existingReport } = await supabase
      .from("daily_route_reports")
      .select("id, status, data_source, renops_shift1, realops_shift1, renops_shift2, realops_shift2, is_fleet_confirmed_s1, is_fleet_confirmed_s2, fleet_status_shift1, fleet_status_shift2")
      .eq("route_id", routeData.id)
      .eq("date", targetDateStr)
      .maybeSingle();

    // 3. Ambil spreadsheet_id terdaftar dari route_sheets
    const { data: sheetConfig, error: sheetError } = await supabase
      .from("route_sheets")
      .select("spreadsheet_id")
      .eq("route_id", routeData.id)
      .eq("year", targetYear)
      .eq("month", targetMonth)
      .maybeSingle();

    if (sheetError || !sheetConfig || !sheetConfig.spreadsheet_id) {
      return new Response(
        JSON.stringify({
          error: `Spreadsheet rute ${routeData.route_code} untuk periode ${targetYear}-${targetMonth} belum dikonfigurasi`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Ambil data dari Google Sheets menggunakan Google Service Account
    const creds = getServiceAccountCredentials();
    if (!creds) {
      return new Response(JSON.stringify({ error: "GOOGLE_SERVICE_ACCOUNT_KEY belum dikonfigurasi" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getGoogleAccessToken(creds);
    const spreadsheetId = sheetConfig.spreadsheet_id;

    const sheetUrl = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(tabName)}!A1:Z60`
    );
    sheetUrl.searchParams.set("valueRenderOption", "UNFORMATTED_VALUE");

    const sheetRes = await fetch(sheetUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!sheetRes.ok) {
      const errText = await sheetRes.text();
      return new Response(
        JSON.stringify({
          error: `Gagal membaca tab '${tabName}' dari Google Sheets (${sheetRes.status}): ${errText}`,
        }),
        { status: sheetRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sheetJson = await sheetRes.json();
    const rows: unknown[][] = sheetJson.values || [];

    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ error: `Tab '${tabName}' tidak memiliki baris data yang cukup` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalisasi string header untuk pencocokan toleran
    const normalizeString = (str: string) => (str ? str.toLowerCase().replace(/[^a-z0-9]/g, "") : "");

    const HEADER_KEYWORDS: Record<string, string[]> = {
      unit: ["nobody", "unit", "bus", "body"],
      toaShift1: ["toashift1", "toashifti", "toas1", "toasi"],
      toaShift2: ["toashift2", "toashiftii", "toas2", "toasii"],
      manualShift1: ["manualshift1", "manualshifti", "manual1", "manuals1", "manualsi"],
      manualShift2: ["manualshift2", "manualshiftii", "manual2", "manuals2", "manualsii"],
      totalToa: ["totaltoa", "total"],
      kmAwal1: ["kilometerawalshift1", "kmawalshift1", "kmawal1", "kmawalshifti", "kmawals1", "kmawalsi"],
      kmAkhir1: ["kilometerakhirshift1", "kmakhirshift1", "kmakhir1", "kmakhirshifti", "kmakhirs1", "kmakhirsi"],
      kmAwal2: ["kilometerawalshift2", "kmawalshift2", "kmawal2", "kmawalshiftii", "kmawals2", "kmawalsii"],
      kmAkhir2: ["kilometerakhirshift2", "kmakhirshift2", "kmakhir2", "kmakhirshiftii", "kmakhirs2", "kmakhirsii"],
      totalKm: ["totalkm", "totalkilometer"],
      keterangan: ["keterangan", "ket", "notes", "catatan"],
    };

    const findColIdx = (headers: string[], keywords: string[]): number => {
      for (let i = 0; i < headers.length; i++) {
        const header = normalizeString(headers[i]);
        if (keywords.some((kw) => header.includes(kw))) {
          return i;
        }
      }
      return -1;
    };

    // Cari baris header utama
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const r = (rows[i] as string[]).map((c) => String(c || ""));
      if (findColIdx(r, HEADER_KEYWORDS.unit) !== -1) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx === -1) {
      headerRowIdx = 0;
    }

    const headerCells = (rows[headerRowIdx] as string[]).map((c) => String(c || ""));
    const colUnit = findColIdx(headerCells, HEADER_KEYWORDS.unit);
    const colKmA1 = findColIdx(headerCells, HEADER_KEYWORDS.kmAwal1);
    const colKmAkh1 = findColIdx(headerCells, HEADER_KEYWORDS.kmAkhir1);
    const colKmA2 = findColIdx(headerCells, HEADER_KEYWORDS.kmAwal2);
    const colKmAkh2 = findColIdx(headerCells, HEADER_KEYWORDS.kmAkhir2);

    const colToaS1 = findColIdx(headerCells, HEADER_KEYWORDS.toaShift1);
    const colManS1 = findColIdx(headerCells, HEADER_KEYWORDS.manualShift1);
    const colToaS2 = findColIdx(headerCells, HEADER_KEYWORDS.toaShift2);
    const colManS2 = findColIdx(headerCells, HEADER_KEYWORDS.manualShift2);

    // Trip pergi & pulang: biasanya terletak tepat setelah kolom unit jika bukan kolom TOA
    let colTrip1 = -1;
    let colTrip2 = -1;
    if (colUnit !== -1 && colUnit + 2 < headerCells.length) {
      const next1 = normalizeString(headerCells[colUnit + 1]);
      const next2 = normalizeString(headerCells[colUnit + 2]);
      if (!next1.includes("toa") && !next1.includes("manual")) colTrip1 = colUnit + 1;
      if (!next2.includes("toa") && !next2.includes("manual")) colTrip2 = colUnit + 2;
    }
    const colKet = findColIdx(headerCells, HEADER_KEYWORDS.keterangan);

    let calcKm = 0;
    let calcToaS1 = 0;
    let calcManS1 = 0;
    let calcToaS2 = 0;
    let calcManS2 = 0;
    let calcTrips = 0;
    let activeBusesS1 = 0;
    let activeBusesS2 = 0;
    const nonSgoUnitsS1: Array<{ unit: string; note: string; isOff: boolean; isOperatingWithNote?: boolean }> = [];
    const nonSgoUnitsS2: Array<{ unit: string; note: string; isOff: boolean; isOperatingWithNote?: boolean }> = [];

    const sheetSummary: Record<string, number> = {};

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r] as any[];
      if (!row || row.length === 0) continue;

      const unitVal = colUnit >= 0 && row[colUnit] !== undefined ? String(row[colUnit]).trim() : "";

      if (unitVal !== "") {
        // Baris data armada bus
        const kmA1 = colKmA1 >= 0 ? parseIndonesianNumber(row[colKmA1]) : 0;
        const kmAkh1 = colKmAkh1 >= 0 ? parseIndonesianNumber(row[colKmAkh1]) : 0;
        const kmA2 = colKmA2 >= 0 ? parseIndonesianNumber(row[colKmA2]) : 0;
        const kmAkh2 = colKmAkh2 >= 0 ? parseIndonesianNumber(row[colKmAkh2]) : 0;

        const km1 = kmAkh1 > kmA1 ? kmAkh1 - kmA1 : 0;
        const km2 = kmAkh2 > kmA2 ? kmAkh2 - kmA2 : 0;
        calcKm += km1 + km2;

        const toaS1 = colToaS1 >= 0 ? parseIndonesianNumber(row[colToaS1]) : 0;
        const manS1 = colManS1 >= 0 ? parseIndonesianNumber(row[colManS1]) : 0;
        const toaS2 = colToaS2 >= 0 ? parseIndonesianNumber(row[colToaS2]) : 0;
        const manS2 = colManS2 >= 0 ? parseIndonesianNumber(row[colManS2]) : 0;

        calcToaS1 += toaS1;
        calcManS1 += manS1;
        calcToaS2 += toaS2;
        calcManS2 += manS2;

        const t1 = colTrip1 >= 0 ? parseIndonesianNumber(row[colTrip1]) : 0;
        const t2 = colTrip2 >= 0 ? parseIndonesianNumber(row[colTrip2]) : 0;
        calcTrips += t1 + t2;

        const rawKet = colKet >= 0 && row[colKet] !== undefined && row[colKet] !== null ? String(row[colKet]).trim() : "";
        const ketUpper = rawKet.toUpperCase();
        const hasWord = (regex: RegExp) => regex.test(ketUpper);
        const isExplicitOff = hasWord(/(^|[^A-Z])(OFF|LIBUR|SPARE|CADANGAN)([^A-Z]|$)/);
        const isExplicitKendala = hasWord(
          /(^|[^A-Z])(MOGOK|RUSAK|LAKA|BAP|SERVICE|PERBAIKAN|TROUBLE|RADIATOR|BAN|BOCOR|DEREK|STUT|SO|TO|EVDAL)([^A-Z]|$)/
        );
        const hasExplicitNote = ketUpper.length > 0 && ketUpper !== "-" && ketUpper !== "0";

        // Unit aktif Shift 1: memiliki ritase/trip fisik di Shift 1, atau jika total trip > 0 & ada pergerakan KM/TOA, dan bukan status off/kendala
        const hasActivityS1 = (t1 > 0 || (calcTrips > 0 && km1 > 0) || toaS1 > 0 || manS1 > 0) && !isExplicitOff && !isExplicitKendala;
        if (hasActivityS1) {
          activeBusesS1++;
          if (hasExplicitNote) {
            nonSgoUnitsS1.push({
              unit: unitVal,
              note: rawKet,
              isOff: false,
              isOperatingWithNote: true,
            });
          }
        } else {
          const isOffStatus = isExplicitOff || (!isExplicitKendala && !hasExplicitNote);
          nonSgoUnitsS1.push({
            unit: unitVal,
            note: hasExplicitNote ? rawKet : (isOffStatus ? "OFF" : "TIDAK OPERASI"),
            isOff: isOffStatus,
          });
        }

        // Unit aktif Shift 2
        const hasActivityS2 = (t2 > 0 || (calcTrips > 0 && km2 > 0) || toaS2 > 0 || manS2 > 0) && !isExplicitOff && !isExplicitKendala;
        if (hasActivityS2) {
          activeBusesS2++;
          if (hasExplicitNote) {
            nonSgoUnitsS2.push({
              unit: unitVal,
              note: rawKet,
              isOff: false,
              isOperatingWithNote: true,
            });
          }
        } else {
          const isOffStatus = isExplicitOff || (!isExplicitKendala && !hasExplicitNote);
          nonSgoUnitsS2.push({
            unit: unitVal,
            note: hasExplicitNote ? rawKet : (isOffStatus ? "OFF" : "TIDAK OPERASI"),
            isOff: isOffStatus,
          });
        }
      } else {
        // Baris rangkuman rumus di bawah tabel (SSOT)
        row.forEach((cellVal: any, cIdx: number) => {
          if (!cellVal) return;
          const cleanStr = String(cellVal).replace(/\s+/g, " ").trim().toLowerCase();
          let key = "";
          if (cleanStr.includes("total pelanggan")) key = "totalPassengers";
          else if (cleanStr.includes("total km")) key = "totalKm";
          else if (cleanStr.includes("km/bus") || cleanStr.includes("km / bus")) key = "kmPerBus";
          else if (cleanStr.includes("toa shift 1") || cleanStr.includes("toa s1")) key = "totalToaS1";
          else if (cleanStr.includes("toa shift 2") || cleanStr.includes("toa s2")) key = "totalToaS2";
          else if (cleanStr.includes("manual shift 1") || cleanStr.includes("manual s1")) key = "totalManS1";
          else if (cleanStr.includes("manual shift 2") || cleanStr.includes("manual s2")) key = "totalManS2";

          if (key && sheetSummary[key] === undefined) {
            for (let offset = 1; offset <= 3; offset++) {
              const nextVal = row[cIdx + offset];
              const parsedNum = parseIndonesianNumber(nextVal);
              if (!isNaN(parsedNum)) {
                sheetSummary[key] = parsedNum;
                break;
              }
            }
          }
        });
      }
    }

    const finalKm = sheetSummary.totalKm !== undefined && sheetSummary.totalKm > 0 ? sheetSummary.totalKm : calcKm;
    const finalToaS1 = sheetSummary.totalToaS1 !== undefined ? sheetSummary.totalToaS1 : calcToaS1;
    const finalManS1 = sheetSummary.totalManS1 !== undefined ? sheetSummary.totalManS1 : calcManS1;
    const finalToaS2 = sheetSummary.totalToaS2 !== undefined ? sheetSummary.totalToaS2 : calcToaS2;
    const finalManS2 = sheetSummary.totalManS2 !== undefined ? sheetSummary.totalManS2 : calcManS2;
    const finalTotalPax = sheetSummary.totalPassengers !== undefined && sheetSummary.totalPassengers > 0
      ? sheetSummary.totalPassengers
      : finalToaS1 + finalManS1 + finalToaS2 + finalManS2;

    // Hitung target renops dinamis berdasarkan hari target
    const [yNum, mNum, dNum] = targetDateStr.split("-").map(Number);
    const dateObj = new Date(yNum, mNum - 1, dNum);
    const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu
    let dynamicTargetRenops = routeData.default_renops || 0;
    if (dayOfWeek === 0) {
      dynamicTargetRenops = routeData.renops_sunday ?? dynamicTargetRenops;
    } else if (dayOfWeek === 6) {
      dynamicTargetRenops = routeData.renops_saturday ?? dynamicTargetRenops;
    } else {
      dynamicTargetRenops = routeData.renops_weekday ?? dynamicTargetRenops;
    }

    const renops = dynamicTargetRenops || Math.max(activeBusesS1, activeBusesS2);
    const realops = Math.max(activeBusesS1, activeBusesS2);
    const kmPerBus = sheetSummary.kmPerBus !== undefined && sheetSummary.kmPerBus > 0
      ? sheetSummary.kmPerBus
      : (realops > 0 ? finalKm / realops : 0);

    const kmBaku = Number(routeData.km_baku) || 0;
    const totalRitase = kmBaku > 0 && finalKm > 0
      ? Number((finalKm / kmBaku).toFixed(1))
      : Number((calcTrips / 2).toFixed(1));

    // Safe Realtime Guard: Lindungi data unit jika sudah dikonfirmasi resmi oleh Korlap di aplikasi
    const isS1Confirmed = Boolean(existingReport?.is_fleet_confirmed_s1);
    const isS2Confirmed = Boolean(existingReport?.is_fleet_confirmed_s2);
    const isAppManual = existingReport?.data_source === "app_input" && (existingReport?.status === "submitted" || existingReport?.status === "verified");

    const finalFleetStatusS1 = (isS1Confirmed || isAppManual) && existingReport?.fleet_status_shift1 && existingReport.fleet_status_shift1.length > 0
      ? existingReport.fleet_status_shift1
      : nonSgoUnitsS1;

    const finalFleetStatusS2 = (isS2Confirmed || isAppManual) && existingReport?.fleet_status_shift2 && existingReport.fleet_status_shift2.length > 0
      ? existingReport.fleet_status_shift2
      : nonSgoUnitsS2;

    const finalRealopsS1 = isS1Confirmed && existingReport?.realops_shift1 !== undefined
      ? existingReport.realops_shift1
      : activeBusesS1;

    const finalRealopsS2 = isS2Confirmed && existingReport?.realops_shift2 !== undefined
      ? existingReport.realops_shift2
      : activeBusesS2;

    // 4. Upsert ke daily_route_reports
    const payload = {
      route_id: routeData.id,
      route_code: routeData.route_code,
      date: targetDateStr,
      renops_shift1: renops,
      realops_shift1: finalRealopsS1,
      renops_shift2: renops,
      realops_shift2: finalRealopsS2,
      toa_shift1: finalToaS1,
      manual_shift1: finalManS1,
      toa_shift2: finalToaS2,
      manual_shift2: finalManS2,
      total_passengers: finalTotalPax,
      total_km: finalKm,
      achievement_km: kmPerBus,
      total_trip: totalRitase,
      fleet_status_shift1: finalFleetStatusS1,
      fleet_status_shift2: finalFleetStatusS2,
      status: (isAppManual || isS1Confirmed || isS2Confirmed)
        ? (existingReport?.status || "submitted")
        : (existingReport?.status === "verified" ? "verified" : "draft"),
      data_source: isAppManual
        ? (existingReport?.data_source || "app_input")
        : (existingReport?.data_source || "sheet_ingestion"),
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("daily_route_reports")
      .upsert(payload, { onConflict: "route_id,date" });

    if (upsertError) {
      return new Response(JSON.stringify({ error: `Gagal menyimpan ke database: ${upsertError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Data spreadsheet berhasil disinkronkan ke Supabase Realtime",
        route: routeData.route_code,
        date: targetDateStr,
        metrics: {
          totalPassengers: finalTotalPax,
          totalKm: finalKm,
          totalTrips: totalRitase,
          realopsS1: finalRealopsS1,
          realopsS2: finalRealopsS2,
          nonSgoCountS1: finalFleetStatusS1.length,
          nonSgoCountS2: finalFleetStatusS2.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Webhook Error";
    console.error("[SheetSyncWebhook] Unhandled error:", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
