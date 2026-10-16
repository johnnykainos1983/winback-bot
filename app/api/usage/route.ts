import { NextResponse } from "next/server";
import { supabaseEnv, consumeMessage } from "@/lib/usage";

export const dynamic = "force-dynamic";

function bearer(req: Request): string | null {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "");
  return m ? m[1] : null;
}

async function handle(req: Request, peek: boolean) {
  const cfg = supabaseEnv();
  if (!cfg) return NextResponse.json({ configured: false });
  const token = bearer(req);
  if (!token) return NextResponse.json({ configured: true, error: "Sign in required" }, { status: 401 });
  const r = await consumeMessage(cfg, token, { peek });
  if ("error" in r) return NextResponse.json({ configured: true, error: r.error }, { status: r.status });
  return NextResponse.json({ configured: true, ...r }, { status: r.allowed ? 200 : 403 });
}

/** Current server-side count for the signed-in account. */
export const GET = (req: Request) => handle(req, true);

/** Count one send (wa.me link opened). 403 once the account has used its free messages. */
export const POST = (req: Request) => handle(req, false);
