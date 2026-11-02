import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-google-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GoogleTokenInfo {
  email?: string;
  verified_email?: boolean | string;
  expires_in?: number;
  audience?: string;
  issued_to?: string;
  error_description?: string;
}

async function verifyGoogleAccessToken(token: string): Promise<{ valid: boolean; email: string | null; error?: string }> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return {
        valid: false,
        email: null,
        error: errBody.error_description || "Token Google tidak valid atau telah kedaluwarsa.",
      };
    }

    const data: GoogleTokenInfo = await res.json();
    if (!data.email) {
      return { valid: false, email: null, error: "Token Google tidak memuat identitas email." };
    }

    const isVerified = data.verified_email === true || data.verified_email === "true";
    if (!isVerified) {
      return { valid: false, email: null, error: "Email akun Google belum terverifikasi." };
    }

    return { valid: true, email: data.email.toLowerCase().trim() };
  } catch (err: any) {
    return { valid: false, email: null, error: err?.message || "Gagal menghubungi layanan verifikasi Google." };
  }
}

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
    // 1. Ekstraksi Google Token dari header khusus x-google-token atau Authorization
    let googleToken = req.headers.get("x-google-token") || "";
    if (!googleToken) {
      const authHeader = req.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ") && !authHeader.includes("supabase")) {
        googleToken = authHeader.replace("Bearer ", "").trim();
      }
    }

    if (!googleToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Akses ditolak: Token autentikasi Google tidak disertakan dalam permintaan.",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verifikasi kriptografis token ke Google Tokeninfo
    const verification = await verifyGoogleAccessToken(googleToken);
    if (!verification.valid || !verification.email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Autentikasi gagal: ${verification.error || "Token tidak valid"}`,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verifiedActingEmail = verification.email;

    // 3. Inisialisasi Supabase Client dengan Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Konfigurasi server internal Supabase belum lengkap.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Parse request body
    const body = await req.json().catch(() => ({}));
    const { action, payload } = body;

    if (!action || typeof action !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Parameter 'action' wajib disertakan." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Dispatch RPC berdasarkan action yang diminta
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

    return new Response(
      JSON.stringify({
        success: true,
        data: rpcData,
        verified_email: verifiedActingEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || "Terjadi kesalahan internal server.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
