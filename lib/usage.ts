import { FREE_LIMIT } from "./types";

export interface UsageResult {
  allowed: boolean;
  count: number;
  limit: number;
}

interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function supabaseEnv(env: Record<string, string | undefined> = process.env): SupabaseEnv | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url: url.replace(/\/$/, ""), anonKey } : null;
}

/**
 * Per-account free-message counter, enforced server-side. Calls the `winback_use_message` Postgres function
 * (see README) with the user's own JWT, so auth.uid() identifies the account and the client can never write the counter.
 * peek=true reads the count without incrementing.
 */
export async function consumeMessage(
  cfg: SupabaseEnv,
  token: string,
  opts: { peek?: boolean; fetchImpl?: typeof fetch } = {},
): Promise<UsageResult | { error: string; status: number }> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(`${cfg.url}/rest/v1/rpc/winback_use_message`, {
    method: "POST",
    headers: { apikey: cfg.anonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_limit: FREE_LIMIT, p_peek: Boolean(opts.peek) }),
  });
  if (res.status === 401 || res.status === 403) return { error: "Not signed in", status: 401 };
  if (!res.ok) return { error: "Usage check failed", status: 502 };
  const rows = (await res.json()) as { allowed: boolean; sent_count: number }[] | { allowed: boolean; sent_count: number };
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row) return { error: "Usage check failed", status: 502 };
  return { allowed: row.allowed, count: row.sent_count, limit: FREE_LIMIT };
}
