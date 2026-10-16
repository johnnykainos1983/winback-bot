import { AppState } from "./types";
import { DEFAULT_STATE, Storage, localStorageAdapter } from "./storage";

export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function cfg() {
  return { url: process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, ""), key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! };
}

const TOKEN_KEY = "winback-bot:sb-token";
export const getToken = () => (typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY));

/** Minimal GoTrue REST auth (email + password), no SDK, so the build needs no env vars. */
export async function signIn(email: string, password: string, signUp = false): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured()) return { ok: false, error: "Supabase is not configured" };
  const { url, key } = cfg();
  const path = signUp ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
  const res = await fetch(url + path, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.msg || data.error_description || "Sign-in failed" };
  if (data.access_token) window.localStorage.setItem(TOKEN_KEY, data.access_token);
  return { ok: true, error: signUp && !data.access_token ? "Check your email to confirm, then sign in." : undefined };
}

export function signOut() {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * Cloud storage: one JSON row per user in table `winback_state` (user_id uuid pk default auth.uid(), data jsonb).
 * See README for the SQL + RLS policy. Falls back to localStorage whenever anything is missing or fails.
 */
export const supabaseAdapter: Storage = {
  kind: "supabase",
  async load() {
    const token = getToken();
    if (!supabaseConfigured() || !token) return localStorageAdapter.load();
    try {
      const { url, key } = cfg();
      const res = await fetch(`${url}/rest/v1/winback_state?select=data&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(String(res.status));
      const rows = (await res.json()) as { data: AppState }[];
      return rows[0] ? { ...DEFAULT_STATE, ...rows[0].data } : localStorageAdapter.load();
    } catch {
      return localStorageAdapter.load();
    }
  },
  async save(state) {
    await localStorageAdapter.save(state); // always keep a local copy
    const token = getToken();
    if (!supabaseConfigured() || !token) return;
    try {
      const { url, key } = cfg();
      await fetch(`${url}/rest/v1/winback_state?on_conflict=user_id`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({ data: state }),
      });
    } catch {
      /* offline: local copy is kept */
    }
  },
};

export function getStorage(): Storage {
  return supabaseConfigured() && getToken() ? supabaseAdapter : localStorageAdapter;
}
