import { NextResponse } from "next/server";
import { providerStatus } from "@/lib/providers";

export const dynamic = "force-dynamic";

/** Bulk send add-ons are stubs: report status only, never send. */
export async function GET() {
  return NextResponse.json({ providers: providerStatus() });
}

export async function POST() {
  return NextResponse.json(
    { sent: 0, message: "Bulk WhatsApp/SMS sending is a paid add-on and is not active in this build." },
    { status: 501 },
  );
}
