import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4173",
  ];

  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.endsWith(".vercel.app") ||
    origin.endsWith(".supabase.co") ||
    (Deno.env.get("ALLOWED_ORIGIN") && origin === Deno.env.get("ALLOWED_ORIGIN"));

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "https://sspdo.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-google-token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// In-Memory Whitelist Cache (TTL: 5 menit)
interface WhitelistCache {
  allowedSpreadsheetIds: Set<string>;
  lastFetched: number;
}

let whitelistCache: WhitelistCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

function getSupabaseAdmin() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function isSpreadsheetAllowed(spreadsheetId: string): Promise<boolean> {
  const trimmedId = spreadsheetId.trim();
  const now = Date.now();

  // 1. Cek dari in-memory cache jika masih segar (< 5 menit)
  if (whitelistCache && now - whitelistCache.lastFetched < CACHE_TTL_MS) {
    if (whitelistCache.allowedSpreadsheetIds.has(trimmedId)) {
      return true;
    }
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("[SheetsProxy] Supabase Admin client gagal diinisialisasi (SUPABASE_URL atau SERVICE_ROLE_KEY tidak ada)");
    // Fail-closed untuk keamanan
    return false;
  }

  // 2. Jika cache kosong atau kedaluwarsa, segarkan dari tabel database route_sheets
  if (!whitelistCache || now - whitelistCache.lastFetched >= CACHE_TTL_MS) {
    const { data, error } = await supabase
      .from("route_sheets")
      .select("spreadsheet_id");

    if (!error && Array.isArray(data)) {
      const idSet = new Set<string>();
      for (const row of data) {
        if (typeof row.spreadsheet_id === "string" && row.spreadsheet_id.trim()) {
          idSet.add(row.spreadsheet_id.trim());
        }
      }
      whitelistCache = {
        allowedSpreadsheetIds: idSet,
        lastFetched: now,
      };

      if (whitelistCache.allowedSpreadsheetIds.has(trimmedId)) {
        return true;
      }
    } else {
      console.warn("[SheetsProxy] Gagal memuat whitelist dari route_sheets:", error?.message);
    }
  }

  // 3. Fallback cache-miss (misal rute baru saja didaftarkan beberapa saat lalu saat cache masih aktif)
  const { data: singleMatch, error: singleError } = await supabase
    .from("route_sheets")
    .select("id")
    .eq("spreadsheet_id", trimmedId)
    .limit(1)
    .maybeSingle();

  if (!singleError && singleMatch) {
    if (whitelistCache) {
      whitelistCache.allowedSpreadsheetIds.add(trimmedId);
    }
    return true;
  }

  return false;
}

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
    // Handle wrapping quotes if passed as string literal
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
      typeof parsed?.client_email === "string" &&
      typeof parsed?.private_key === "string"
    ) {
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
        token_uri: (parsed.token_uri as string) || "https://oauth2.googleapis.com/token",
      };
    }
  } catch (err) {
    console.error("[SheetsProxy] Gagal mem-parse kredensial Service Account:", err);
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
    console.error("[SheetsProxy] Gagal pertukaran token Google OAuth2:", errorBody);
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

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

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
    const { action, spreadsheetId, params, payload } = body;

    const creds = getServiceAccountCredentials();

    // Endpoint health check untuk mendeteksi kesiapan Service Account
    if (action === "health") {
      const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY") || Deno.env.get("GSERVICEACCOUNT_KEY");
      let parseStatus = "no_env";
      let errorDetail = null;

      if (raw) {
        try {
          let text = raw.trim();
          if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
            try {
              const unquoted = JSON.parse(text);
              if (typeof unquoted === "string") text = unquoted.trim();
            } catch {
              text = text.slice(1, -1).trim();
            }
          }
          let parsed: Record<string, unknown> | null = null;
          if (text.includes("{")) {
            try {
              parsed = JSON.parse(text) as Record<string, unknown>;
            } catch {
              parsed = extractFirstJsonObject(text);
            }
          } else {
            try {
              parsed = JSON.parse(atob(text)) as Record<string, unknown>;
            } catch {
              parsed = extractFirstJsonObject(atob(text));
            }
          }
          if (
            typeof parsed?.client_email === "string" &&
            typeof parsed?.private_key === "string"
          ) {
            parseStatus = "valid";
          } else {
            parseStatus = "missing_fields";
            errorDetail = `Keys found: ${Object.keys(parsed || {}).join(", ")}`;
          }
        } catch (e: unknown) {
          parseStatus = "parse_failed";
          errorDetail = e instanceof Error ? e.message : String(e);
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          configured: !!creds,
          client_email: creds ? creds.client_email : null,
          diagnostics: {
            has_env: !!raw,
            configured: !!creds,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!creds) {
      return new Response(
        JSON.stringify({
          error: "GOOGLE_SERVICE_ACCOUNT_KEY belum dikonfigurasi di Supabase Secrets",
          code: "SERVICE_ACCOUNT_UNCONFIGURED",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("apikey");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Otorisasi tidak valid atau tidak disertakan" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!spreadsheetId || typeof spreadsheetId !== "string" || !/^[a-zA-Z0-9-_]{15,100}$/.test(spreadsheetId.trim())) {
      return new Response(
        JSON.stringify({ error: "spreadsheetId tidak valid atau tidak disertakan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validasi Whitelist Spreadsheet Terdaftar
    const isAllowed = await isSpreadsheetAllowed(spreadsheetId);
    if (!isAllowed) {
      console.warn(`[SheetsProxy] Akses ditolak: spreadsheetId '${spreadsheetId}' tidak terdaftar di route_sheets`);
      return new Response(
        JSON.stringify({
          error: "Akses ditolak: Spreadsheet ID tidak terdaftar dalam rute operasional resmi.",
          code: "SPREADSHEET_NOT_ALLOWED",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validasi Integritas Payload Aksi Tulis / Mutasi
    if (action === "values.batchUpdate") {
      if (!payload || typeof payload !== "object" || !Array.isArray(payload.data)) {
        return new Response(
          JSON.stringify({ error: "Payload values.batchUpdate tidak valid atau tidak memiliki array data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (action === "batchUpdate") {
      if (!payload || typeof payload !== "object" || !Array.isArray(payload.requests)) {
        return new Response(
          JSON.stringify({ error: "Payload batchUpdate tidak valid atau tidak memiliki array requests" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const accessToken = await getGoogleAccessToken(creds);
    const googleHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    let targetUrl = "";
    let method = "GET";
    let requestBody: string | undefined = undefined;

    switch (action) {
      case "spreadsheets.get": {
        const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`);
        if (params?.fields) {
          url.searchParams.set("fields", params.fields);
        }
        targetUrl = url.toString();
        method = "GET";
        break;
      }

      case "values.get": {
        const range = params?.range || "";
        const url = new URL(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`
        );
        if (params?.valueRenderOption) {
          url.searchParams.set("valueRenderOption", params.valueRenderOption);
        }
        targetUrl = url.toString();
        method = "GET";
        break;
      }

      case "values.batchGet": {
        const url = new URL(
          `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchGet`
        );
        if (params?.ranges) {
          const ranges = Array.isArray(params.ranges) ? params.ranges : [params.ranges];
          for (const r of ranges) {
            url.searchParams.append("ranges", r);
          }
        }
        if (params?.valueRenderOption) {
          url.searchParams.set("valueRenderOption", params.valueRenderOption);
        }
        targetUrl = url.toString();
        method = "GET";
        break;
      }

      case "values.batchUpdate": {
        targetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`;
        method = "POST";
        requestBody = JSON.stringify(payload || {});
        break;
      }

      case "batchUpdate": {
        targetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`;
        method = "POST";
        requestBody = JSON.stringify(payload || {});
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Aksi tidak dikenal: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const googleRes = await fetch(targetUrl, {
      method,
      headers: googleHeaders,
      body: requestBody,
    });

    const resData = await googleRes.json();
    return new Response(JSON.stringify(resData), {
      status: googleRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Proxy Error";
    console.error("[SheetsProxy] Unhandled error:", err);
    return new Response(
      JSON.stringify({
        error: message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
