import { NextResponse } from "next/server";
import { checkPaystackKey, PRICE_ZAR } from "@/lib/paystack";
import { getFounderStore } from "@/lib/founder";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const status = checkPaystackKey(process.env.PAYSTACK_SECRET_KEY);
  if (status === "missing") {
    return NextResponse.json({ configured: false, message: "Payments are not configured yet (stub)." });
  }
  if (status === "live-rejected") {
    return NextResponse.json(
      { configured: false, error: "Only Paystack TEST keys (sk_test_...) are accepted in this build." },
      { status: 400 },
    );
  }
  // Any "founder" flag in the body is ignored on purpose: the server decides from the slot counter.
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  let founder: boolean;
  let remaining: number;
  try {
    ({ founder, remaining } = await getFounderStore().claim(body.email));
  } catch {
    return NextResponse.json({ error: "Could not check founder slots. Please try again." }, { status: 502 });
  }
  const amountZar = founder ? PRICE_ZAR.founder : PRICE_ZAR.standard;
  // STUB: a real implementation would POST to https://api.paystack.co/transaction/initialize
  // with amount (in cents) = amountZar * 100, currency ZAR, and only confirm the founder slot once the charge succeeds.
  // No network call is made here.
  return NextResponse.json({
    configured: true,
    stub: true,
    mode: "test",
    founder,
    amountZar,
    founderRemaining: remaining,
    message: `Test-mode stub: ${founder ? "founder" : "standard"} price R${amountZar}/month. No charge was made and no request was sent to Paystack.`,
  });
}

export async function GET() {
  const status = checkPaystackKey(process.env.PAYSTACK_SECRET_KEY);
  let founderRemaining: number | null = null;
  try {
    founderRemaining = await getFounderStore().remaining();
  } catch {
    /* counter unavailable: report null and let the UI show the standard price */
  }
  return NextResponse.json({ configured: status === "ok", status, founderSlots: PRICE_ZAR.founderSlots, founderRemaining });
}
