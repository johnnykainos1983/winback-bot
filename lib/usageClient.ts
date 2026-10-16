import { getToken, supabaseConfigured } from "./supabase";

export type OpenCheck = { allowed: boolean; count?: number };

/**
 * Ask the server to count one send for the signed-in account. When Supabase is not configured, or nobody is
 * signed in, or the server is unreachable, returns { allowed: true } with no count and the caller falls back
 * to the localStorage counter.
 */
export async function checkServerUsage(): Promise<OpenCheck> {
  const token = getToken();
  if (!supabaseConfigured() || !token) return { allowed: true };
  try {
    const res = await fetch("/api/usage", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const d = (await res.json().catch(() => ({}))) as { configured?: boolean; allowed?: boolean; count?: number };
    if (d.configured === false || typeof d.count !== "number") return { allowed: true };
    return { allowed: Boolean(d.allowed), count: d.count };
  } catch {
    return { allowed: true };
  }
}
