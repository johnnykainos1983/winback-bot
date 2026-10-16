export type PaystackKeyStatus = "missing" | "live-rejected" | "ok";

/** Test mode only: anything not starting with sk_test_ is rejected. */
export function checkPaystackKey(key: string | undefined): PaystackKeyStatus {
  if (!key) return "missing";
  return key.startsWith("sk_test_") ? "ok" : "live-rejected";
}

export const PRICE_ZAR = { standard: 149, founder: 99, founderSlots: 50 };
