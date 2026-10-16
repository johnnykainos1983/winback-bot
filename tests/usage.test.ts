import { describe, expect, it, vi } from "vitest";
import { applyOpen, applySent, canOpen } from "@/lib/queue";
import { consumeMessage, supabaseEnv } from "@/lib/usage";
import { DEFAULT_STATE } from "@/lib/storage";
import type { AppState, Contact } from "@/lib/types";

const c = (id: string, o: Partial<Contact> = {}): Contact => ({ id, name: id, phone: "+27821234567", job: "", date: "", consent: true, sent: false, ...o });
const st = (o: Partial<AppState> = {}): AppState => ({ ...DEFAULT_STATE, contacts: [c("a"), c("b")], ...o });

describe("free limit counted when the link is opened", () => {
  it("counts once per contact on open, not again on 'I sent it'", () => {
    let s = applyOpen(st(), "a");
    expect(s.sentCount).toBe(1);
    s = applyOpen(s, "a"); // reopening the same link
    expect(s.sentCount).toBe(1);
    s = applySent(s, "a");
    expect(s.sentCount).toBe(1);
    expect(s.contacts[0]).toMatchObject({ opened: true, sent: true });
  });
  it("'I sent it' without an open still counts once", () => {
    expect(applySent(st(), "a").sentCount).toBe(1);
  });
  it("disables the link once 10 are used", () => {
    const s = st({ sentCount: 10 });
    expect(canOpen(s.contacts[0], s.sentCount, "free")).toBe(false);
    expect(applyOpen(s, "a")).toBe(s);
    expect(applySent(s, "a")).toBe(s);
  });
  it("the 10th open is allowed, the 11th is not", () => {
    const s = st({ sentCount: 9 });
    expect(canOpen(s.contacts[0], 9, "free")).toBe(true);
    const after = applyOpen(s, "a");
    expect(after.sentCount).toBe(10);
    expect(canOpen(after.contacts[1], after.sentCount, "free")).toBe(false);
  });
  it("an already-counted contact can still be marked sent at the limit", () => {
    const s = st({ sentCount: 10, contacts: [c("a", { opened: true })] });
    expect(canOpen(s.contacts[0], 10, "free")).toBe(true);
    expect(applySent(s, "a").contacts[0].sent).toBe(true);
    expect(applySent(s, "a").sentCount).toBe(10);
  });
  it("paid plan is never limited", () => {
    expect(canOpen(c("a"), 500, "paid")).toBe(true);
  });
  it("adopts the server count when it is ahead of the local one", () => {
    expect(applyOpen(st({ sentCount: 2 }), "a", 7).sentCount).toBe(7);
  });
});

describe("server-side usage (/api/usage)", () => {
  const cfg = { url: "https://x.supabase.co", anonKey: "anon" };
  const reply = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it("is not configured without env vars", () => {
    expect(supabaseEnv({})).toBeNull();
    expect(supabaseEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co/", NEXT_PUBLIC_SUPABASE_ANON_KEY: "k" })).toEqual({ url: "https://x.supabase.co", anonKey: "k" });
  });
  it("calls the rpc with the user's token and the free limit", async () => {
    const f = reply([{ allowed: true, sent_count: 3 }]);
    const r = await consumeMessage(cfg, "jwt", { fetchImpl: f });
    expect(r).toEqual({ allowed: true, count: 3, limit: 10 });
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://x.supabase.co/rest/v1/rpc/winback_use_message");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt");
    expect(JSON.parse(init.body as string)).toEqual({ p_limit: 10, p_peek: false });
  });
  it("reports not allowed when the account is at the limit", async () => {
    expect(await consumeMessage(cfg, "jwt", { fetchImpl: reply([{ allowed: false, sent_count: 10 }]) })).toEqual({ allowed: false, count: 10, limit: 10 });
  });
  it("maps auth and upstream failures", async () => {
    expect(await consumeMessage(cfg, "bad", { fetchImpl: reply({}, 401) })).toEqual({ error: "Not signed in", status: 401 });
    expect(await consumeMessage(cfg, "jwt", { fetchImpl: reply({}, 500) })).toEqual({ error: "Usage check failed", status: 502 });
  });

  it("route: not configured -> falls back; missing token -> 401; at limit -> 403", async () => {
    const { POST } = await import("@/app/api/usage/route");
    const prev = { u: process.env.NEXT_PUBLIC_SUPABASE_URL, k: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
    try {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      expect(await (await POST(new Request("http://t/api/usage", { method: "POST" }))).json()).toEqual({ configured: false });

      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
      expect((await POST(new Request("http://t/api/usage", { method: "POST" }))).status).toBe(401);

      const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify([{ allowed: false, sent_count: 10 }])));
      const res = await POST(new Request("http://t/api/usage", { method: "POST", headers: { Authorization: "Bearer jwt" } }));
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ allowed: false, count: 10 });
      spy.mockRestore();
    } finally {
      if (prev.u === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = prev.u;
      if (prev.k === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prev.k;
    }
  });
});
