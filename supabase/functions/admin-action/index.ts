import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-google-token, x-admin-session-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================================================
// Web Crypto Base64URL & JWT Helpers (Zero-Dependency, Standard Web API)
// ============================================================================

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function textToBase64Url(text: string): string {
  const encoder = new TextEncoder();
  return uint8ArrayToBase64Url(encoder.encode(text));
}

function base64UrlToText(str: string): string {
  const bytes = base64UrlToUint8Array(str);
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

async function signAdminSessionToken(email: string, role: string, secret: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    email: email.toLowerCase().trim(),
    role,
    iat: now,
    exp: now + 365 * 24 * 60 * 60, // 1 tahun masa berlaku (Golden Rule #3: Sesi Permanen)
  };

  const encHeader = textToBase64Url(JSON.stringify(header));
  const encPayload = textToBase64Url(JSON.stringify(payload));
  const data = `${encHeader}.${encPayload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const encSig = uint8ArrayToBase64Url(new Uint8Array(signature));
  return `${data}.${encSig}`;
}

async function verifyAdminSessionToken(
  token: string,
  secret: string
): Promise<{ valid: boolean; email?: string; role?: string; error?: string }> {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Format token sesi tidak valid (bukan 3 segmen JWT)." };
    }

    const [encHeader, encPayload, encSig] = parts;
    const data = `${encHeader}.${encPayload}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToUint8Array(encSig);
    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
    if (!isValid) {
      return { valid: false, error: "Tanda tangan token sesi tidak sah." };
    }

    const payload = JSON.parse(base64UrlToText(encPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: "Token sesi telah kedaluwarsa." };
    }

    if (!payload.email) {
      return { valid: false, error: "Token sesi tidak memuat alamat email." };
    }

    return { valid: true, email: String(payload.email).toLowerCase().trim(), role: payload.role };
  } catch (err: any) {
    return { valid: false, error: err?.message || "Gagal memverifikasi token sesi administratif." };
  }
}

// ============================================================================
// Google OAuth2 Access Token Verification (Userinfo Primary + Tokeninfo Fallback)
// ============================================================================

async function verifyGoogleAccessToken(
  token: string
): Promise<{ valid: boolean; email: string | null; error?: string }> {
  const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
  if (!cleanToken) {
    return { valid: false, email: null, error: "Token Google kosong." };
  }

  try {
    // 1. Verifikasi Utama: Google OAuth2 Userinfo API (standar resmi untuk Bearer access token)
    const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
      },
    });

    if (userinfoRes.ok) {
      const data = await userinfoRes.json().catch(() => ({}));
      if (data && data.email) {
        return { valid: true, email: String(data.email).toLowerCase().trim() };
      }
    }

    // 2. Fallback: Google Tokeninfo API
    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(cleanToken)}`
    );
    if (tokenInfoRes.ok) {
      const data = await tokenInfoRes.json().catch(() => ({}));
      if (data && data.email) {
        return { valid: true, email: String(data.email).toLowerCase().trim() };
      }
    }

    const errDetail = userinfoRes.status !== 200 ? `Status ${userinfoRes.status}` : "Token tidak dikenali";
    return {
      valid: false,
      email: null,
      error: `Token Google tidak valid atau telah kedaluwarsa (${errDetail}).`,
    };
  } catch (err: any) {
    return {
      valid: false,
      email: null,
      error: err?.message || "Gagal menghubungi layanan verifikasi Google.",
    };
  }
}

// ============================================================================
// Edge Function Request Handler
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Hanya metode POST yang didukung." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[AdminAction] SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum terkonfigurasi");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Konfigurasi server internal Supabase belum lengkap.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Parse body permintaan lebih awal agar token yang dikirim di body dapat dibaca
    const body = await req.json().catch(() => ({}));
    const { action, payload, admin_session_token, google_token } = body;

    // 2. Otorisasi Pemanggil: Prioritas 1 = session token (dari body atau header), Prioritas 2 = google token (dari body atau header)
    let verifiedActingEmail = "";
    let isFreshGoogleAuth = false;

    const adminSessionToken =
      (typeof admin_session_token === "string" ? admin_session_token.trim() : "") ||
      req.headers.get("x-admin-session-token")?.trim() ||
      "";

    if (adminSessionToken) {
      const sessionResult = await verifyAdminSessionToken(adminSessionToken, supabaseServiceKey);
      if (sessionResult.valid && sessionResult.email) {
        verifiedActingEmail = sessionResult.email;
      } else {
        console.warn("[AdminAction] Admin session token tidak valid:", sessionResult.error);
      }
    }

    if (!verifiedActingEmail) {
      const candidateGoogleToken =
        (typeof google_token === "string" ? google_token.trim() : "") ||
        req.headers.get("x-google-token")?.trim() ||
        "";

      if (candidateGoogleToken) {
        const verification = await verifyGoogleAccessToken(candidateGoogleToken);
        if (verification.valid && verification.email) {
          verifiedActingEmail = verification.email;
          isFreshGoogleAuth = true;
        } else {
          console.warn("[AdminAction] Verifikasi token Google gagal:", verification.error);
          return new Response(
            JSON.stringify({
              success: false,
              error: `Autentikasi gagal: ${verification.error || "Token tidak valid"}`,
            }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!verifiedActingEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Akses ditolak: Sesi kredensial autentikasi tidak disertakan atau telah kedaluwarsa.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!action || typeof action !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Parameter 'action' wajib disertakan." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Aksi Khusus: Buat / Segarkan Token Sesi Administratif Permanen (create_admin_session)
    if (action === "create_admin_session") {
      const { data: userProfile, error: profileErr } = await supabase
        .from("user_profiles")
        .select("role_id, is_active, roles(code)")
        .ilike("email", verifiedActingEmail)
        .single();

      if (profileErr || !userProfile || !userProfile.is_active) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Akses ditolak: Profil pengguna tidak ditemukan atau akun dinonaktifkan.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const roleCode = (userProfile as any).roles?.code || "petugas";
      if (roleCode !== "superadmin" && roleCode !== "admin") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Akses ditolak: Hanya peran administrator atau superadmin yang dapat memiliki sesi admin.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const sessionToken = await signAdminSessionToken(verifiedActingEmail, roleCode, supabaseServiceKey);
      return new Response(
        JSON.stringify({
          success: true,
          session_token: sessionToken,
          verified_email: verifiedActingEmail,
          role: roleCode,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Dispatch RPC Administratif
    let rpcName = "";
    let rpcParams: Record<string, any> = {};

    switch (action) {
      case "update_user_role":
        rpcName = "admin_update_user_role";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_target_email: payload?.targetEmail,
          p_new_role_id: payload?.newRoleId,
        };
        break;

      case "toggle_user_status":
        rpcName = "admin_toggle_user_status";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_target_email: payload?.targetEmail,
          p_is_active: payload?.isActive,
        };
        break;

      case "add_user_profile":
        rpcName = "admin_add_user_profile";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_email: payload?.email,
          p_full_name: payload?.fullName,
          p_role_id: payload?.roleId,
          p_notes: payload?.notes,
        };
        break;

      case "set_page_setting":
        rpcName = "set_app_page_setting";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_page_key: payload?.pageKey,
          p_is_enabled: payload?.isEnabled,
        };
        break;

      case "update_page_permissions":
        rpcName = "admin_update_page_permissions";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_page_key: payload?.pageKey,
          p_allowed_roles: payload?.allowedRoles,
          p_allowed_user_emails: payload?.allowedUserEmails,
          p_denied_user_emails: payload?.deniedUserEmails,
        };
        break;

      case "bulk_update_page_settings":
        rpcName = "admin_bulk_update_page_settings";
        rpcParams = {
          p_acting_email: verifiedActingEmail,
          p_page_keys: payload?.pageKeys,
          p_action: payload?.bulkAction,
          p_is_enabled: payload?.isEnabled,
          p_allowed_roles: payload?.allowedRoles,
        };
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Aksi administratif '${action}' tidak dikenali.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Eksekusi RPC via Service Role
    const { data: rpcData, error: rpcError } = await (supabase as any).rpc(rpcName, rpcParams);

    if (rpcError) {
      console.warn(`[AdminAction] RPC '${rpcName}' mengembalikan error:`, rpcError.message);
      const isAccessDenied = rpcError.message && rpcError.message.includes("Akses ditolak");
      return new Response(
        JSON.stringify({
          success: false,
          error: rpcError.message || "Gagal mengeksekusi operasi administratif.",
        }),
        {
          status: isAccessDenied ? 403 : 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Jika berhasil dan menggunakan Google token, sertakan token sesi baru agar klien auto-upgrade
    let newSessionToken: string | undefined = undefined;
    if (isFreshGoogleAuth) {
      try {
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("roles(code)")
          .ilike("email", verifiedActingEmail)
          .single();
        const roleCode = (userProfile as any)?.roles?.code || "admin";
        newSessionToken = await signAdminSessionToken(verifiedActingEmail, roleCode, supabaseServiceKey);
      } catch (tokenErr) {
        console.warn("[AdminAction] Gagal menerbitkan session_token otomatis:", tokenErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: rpcData,
        verified_email: verifiedActingEmail,
        ...(newSessionToken ? { session_token: newSessionToken } : {}),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[AdminAction] Unhandled exception:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Terjadi kesalahan internal server.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
