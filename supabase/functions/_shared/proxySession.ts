// ============================================================================
// Sesi proxy bertanda tangan (BUG-SEC-205-01), dipindah dari sheets-proxy agar dipakai bersama
// sheets-proxy & route-confirmation. Alur: token Google pengguna (sekali) → sesi HMAC 12 jam →
// setiap aksi wajib sesi valid milik akun user_profiles yang aktif.
// ============================================================================

// ponytail: sesi 12 jam agar PDO tidak diminta login ulang tiap token Google (1 jam) habis;
// akun yang dinonaktifkan tetap tertolak ≤5 menit lewat cek is_active ber-cache.
const PROXY_SESSION_TTL_SEC = 12 * 60 * 60;
const ACTIVE_USER_CACHE_TTL_MS = 5 * 60 * 1000;
const GOOGLE_TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;
const activeUserCache = new Map<string, { active: boolean; at: number }>();
const googleTokenCache = new Map<string, { email: string; at: number }>();

function base64UrlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getSessionKey(usage: KeyUsage): Promise<CryptoKey | null> {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!serviceKey) return null;
  // Kunci diturunkan khusus proxy agar token sesi admin-action dan sheets-proxy tidak saling diterima
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${serviceKey}:sheets-proxy-session`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

export async function signProxySession(email: string): Promise<{ sessionToken: string; expiresAt: number }> {
  const key = await getSessionKey("sign");
  if (!key) throw new Error("Konfigurasi server belum lengkap");
  const exp = Math.floor(Date.now() / 1000) + PROXY_SESSION_TTL_SEC;
  const payload = base64UrlEncode(JSON.stringify({ email, exp, scope: "sheets-proxy" }));
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return { sessionToken: `${payload}.${base64UrlEncode(new Uint8Array(sig))}`, expiresAt: exp * 1000 };
}

export async function verifyProxySession(token: string): Promise<string | null> {
  try {
    const [payload, sig] = token.trim().split(".");
    if (!payload || !sig) return null;
    const key = await getSessionKey("verify");
    if (!key) return null;
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(sig) as unknown as BufferSource,
      new TextEncoder().encode(payload)
    );
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    if (data?.scope !== "sheets-proxy" || typeof data?.email !== "string") return null;
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data.email;
  } catch {
    return null;
  }
}

export async function verifyGoogleUserEmail(googleToken: string): Promise<string | null> {
  const now = Date.now();
  const cached = googleTokenCache.get(googleToken);
  if (cached && now - cached.at < GOOGLE_TOKEN_CACHE_TTL_MS) return cached.email;

  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${googleToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  if (!data?.email || data.email_verified === false) return null;
  const email = String(data.email).toLowerCase().trim();
  if (googleTokenCache.size > 500) googleTokenCache.clear();
  googleTokenCache.set(googleToken, { email, at: now });
  return email;
}

// deno-lint-ignore no-explicit-any
export async function isActiveUser(supabase: { from: (table: string) => any } | null, email: string): Promise<boolean> {
  const now = Date.now();
  const cached = activeUserCache.get(email);
  if (cached && now - cached.at < ACTIVE_USER_CACHE_TTL_MS) return cached.active;
  if (!supabase) return false;
  // Email user_profiles tersimpan lowercase (diverifikasi 6 Nov 2026), jadi eq presisi tanpa wildcard ilike
  const { data, error } = await supabase
    .from("user_profiles")
    .select("is_active")
    .eq("email", email)
    .maybeSingle();
  if (error) return false;
  const active = Boolean(data?.is_active);
  if (activeUserCache.size > 500) activeUserCache.clear();
  activeUserCache.set(email, { active, at: now });
  return active;
}
