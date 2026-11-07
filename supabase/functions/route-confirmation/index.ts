// Konfirmasi "Siap Dikirim" per rute/tanggal. Tulis hanya lewat fungsi ini (service_role);
// nilai audit (jumlah masalah, fingerprint) diambil server, bukan dari klien.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { getCorsHeaders } from "../_shared/cors.ts";
import { isActiveUser, verifyProxySession } from "../_shared/proxySession.ts";
import { evaluatePageAccess } from "../_shared/pageAccess.ts";
import { REASON_MIN_LENGTH, sanitizeReason, validateConfirmationDate, wibTodayString } from "../_shared/submissionRules.ts";
import { countCompletenessIssues, type RouteCompleteness } from "../_shared/completeness.ts";

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Hanya metode POST yang didukung", code: "FAILED" }, 405, cors);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceKey) return json({ error: "Konfigurasi server belum lengkap", code: "FAILED" }, 500, cors);
    const supabase = createClient(supabaseUrl, serviceKey);

    const email = await verifyProxySession(req.headers.get("x-proxy-session") || "");
    if (!email || !(await isActiveUser(supabase, email))) {
      return json({ error: "Sesi akses tidak valid atau kedaluwarsa.", code: "PROXY_SESSION_INVALID" }, 401, cors);
    }

    const { data: profile } = await supabase.from("user_profiles").select("roles(code)").eq("email", email).maybeSingle();
    // deno-lint-ignore no-explicit-any
    const role: string | null = (profile as any)?.roles?.code ?? null;
    const { data: setting } = await supabase
      .from("app_page_settings")
      .select("is_enabled, allowed_roles, allowed_user_emails, denied_user_emails")
      .eq("page_key", "regional_monitoring")
      .maybeSingle();
    if (!evaluatePageAccess("regional_monitoring", setting, role, email)) {
      return json({ error: "Tidak memiliki akses konfirmasi.", code: "ACCESS_DENIED" }, 403, cors);
    }

    const body = await req.json().catch(() => ({}));
    const routeId = Number(body?.routeId);
    const date = String(body?.date ?? "");
    if (!Number.isInteger(routeId) || routeId <= 0) return json({ error: "Rute tidak valid.", code: "INVALID_ROUTE" }, 400, cors);
    if (validateConfirmationDate(date, wibTodayString()) !== "ok") {
      return json({ error: "Tanggal di luar rentang konfirmasi.", code: "INVALID_DATE" }, 400, cors);
    }

    const { data: route } = await supabase.from("routes").select("id, route_code").eq("id", routeId).maybeSingle();
    if (!route) return json({ error: "Rute tidak terdaftar.", code: "ROUTE_NOT_FOUND" }, 404, cors);

    const { data: report } = await supabase
      .from("daily_route_reports")
      .select("completeness")
      .eq("route_id", routeId)
      .eq("date", date)
      .maybeSingle();
    const completeness = (report?.completeness ?? null) as RouteCompleteness | null;
    const issues = countCompletenessIssues(completeness);
    const reason = sanitizeReason(body?.reason);
    if (issues > 0 && reason.length < REASON_MIN_LENGTH) {
      return json({ error: "Alasan wajib diisi.", code: "REASON_REQUIRED" }, 400, cors);
    }

    const row = {
      route_id: route.id,
      route_code: route.route_code,
      date,
      confirmed_by: email,
      confirmed_at: new Date().toISOString(),
      issues_at_confirm: issues,
      reason: reason || null,
      fingerprint_at_confirm: completeness?.fingerprint || null,
    };
    const { data: saved, error: saveError } = await supabase
      .from("route_submission_confirmations")
      .upsert(row, { onConflict: "route_id,date" })
      .select("route_id, route_code, date, confirmed_by, confirmed_at, issues_at_confirm, reason, fingerprint_at_confirm")
      .single();
    if (saveError || !saved) {
      console.error("[RouteConfirmation] Gagal menyimpan:", saveError?.message);
      return json({ error: "Konfirmasi gagal disimpan.", code: "FAILED" }, 500, cors);
    }

    // 1 baris log per aksi (AGENTS.md: agregasi activity_logs)
    const { error: logError } = await supabase.from("activity_logs").insert([{
      user_email: email,
      action: "CONFIRM_SUBMISSION",
      route_code: route.route_code,
      details: { date, issues, reason: row.reason },
    }]);
    if (logError) console.warn("[RouteConfirmation] Gagal menulis activity_logs:", logError.message);

    return json({ ok: true, confirmation: saved }, 200, cors);
  } catch (err) {
    console.error("[RouteConfirmation] Unhandled:", err instanceof Error ? err.message : err);
    return json({ error: "Terjadi kesalahan server.", code: "FAILED" }, 500, cors);
  }
});
