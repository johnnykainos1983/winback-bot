import { NextResponse } from "next/server";
import { checkPaystackKey, PRICE_ZAR } from "@/lib/paystack";

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
  const body = (await req.json().catch(() => ({}))) as { email?: string; founder?: boolean };
  if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  const amountZar = body.founder ? PRICE_ZAR.founder : PRICE_ZAR.standard;
  // STUB: a real implementation would POST to https://api.paystack.co/transaction/initialize
  // with amount (in cents) = amountZar * 100, currency ZAR. No network call is made here.
  return NextResponse.json({
    configured: true,
    stub: true,
    mode: "test",
    amountZar,
    message: "Test-mode stub: no charge was made and no request was sent to Paystack.",
  });
}

export async function GET() {
  const status = checkPaystackKey(process.env.PAYSTACK_SECRET_KEY);
  return NextResponse.json({ configured: status === "ok", status });
}
