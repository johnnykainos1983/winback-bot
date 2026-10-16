import { PRICE_ZAR } from "./paystack";

export interface FounderClaim {
  founder: boolean;
  remaining: number;
}

export interface FounderStore {
  readonly kind: "memory" | "supabase";
  remaining(): Promise<number>;
  /** Idempotent per email: an email that already holds a slot keeps it. Takes a slot only while any are left. */
  claim(email: string): Promise<FounderClaim>;
}

/** Stub store used when Supabase is not configured. Resets on server restart. */
export function memoryFounderStore(total = PRICE_ZAR.founderSlots): FounderStore {
  const holders = new Set<string>();
  return {
    kind: "memory",
    async remaining() {
      return Math.max(0, total - holders.size);
    },
    async claim(email) {
      const key = email.trim().toLowerCase();
      if (!holders.has(key) && holders.size < total) holders.add(key);
      return { founder: holders.has(key), remaining: Math.max(0, total - holders.size) };
    },
  };
}

/**
 * Supabase store. Needs the server-only service role key because anonymous visitors have no account yet.
 * Slots live in table `winback_founders`; the claim is atomic via function `winback_claim_founder` (see README).
 */
export function supabaseFounderStore(url: string, serviceKey: string, total = PRICE_ZAR.founderSlots, fetchImpl: typeof fetch = fetch): FounderStore {
  const base = url.replace(/\/$/, "");
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
  return {
    kind: "supabase",
    async remaining() {
      const res = await fetchImpl(`${base}/rest/v1/winback_founders?select=email&limit=0`, { headers: { ...headers, Prefer: "count=exact" } });
      if (!res.ok) throw new Error(`founder count failed: ${res.status}`);
      const taken = Number((res.headers.get("content-range") ?? "").split("/")[1]);
      if (!Number.isFinite(taken)) throw new Error("founder count unreadable");
      return Math.max(0, total - taken);
    },
    async claim(email) {
      const res = await fetchImpl(`${base}/rest/v1/rpc/winback_claim_founder`, {
        method: "POST",
        headers,
        body: JSON.stringify({ p_email: email.trim().toLowerCase(), p_total: total }),
      });
      if (!res.ok) throw new Error(`founder claim failed: ${res.status}`);
      const rows = (await res.json()) as { out_founder: boolean; out_taken: number }[];
      const row = rows[0];
      if (!row) throw new Error("founder claim empty");
      return { founder: row.out_founder, remaining: Math.max(0, total - row.out_taken) };
    },
  };
}

const g = globalThis as unknown as { __founderMemory?: FounderStore };

export function getFounderStore(env: Record<string, string | undefined> = process.env): FounderStore {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return supabaseFounderStore(url, key);
  return (g.__founderMemory ??= memoryFounderStore());
}
