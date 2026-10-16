import { afterEach, describe, expect, it, vi } from "vitest";
import { memoryFounderStore, supabaseFounderStore } from "@/lib/founder";
import { GET, POST } from "@/app/api/paystack/route";

describe("memoryFounderStore", () => {
  it("gives out slots until they run out, one per email", async () => {
    const s = memoryFounderStore(2);
    expect(await s.remaining()).toBe(2);
    expect(await s.claim("a@x.co")).toEqual({ founder: true, remaining: 1 });
    expect(await s.claim("A@x.co")).toEqual({ founder: true, remaining: 1 }); // same email, same slot
    expect(await s.claim("b@x.co")).toEqual({ founder: true, remaining: 0 });
    expect(await s.claim("c@x.co")).toEqual({ founder: false, remaining: 0 });
    expect(await s.remaining()).toBe(0);
  });
});

describe("supabaseFounderStore", () => {
  it("reads the count from content-range and claims via rpc", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response("[]", { headers: { "content-range": "*/47" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ out_founder: true, out_taken: 48 }])));
    const s = supabaseFounderStore("https://x.supabase.co", "svc", 50, f as unknown as typeof fetch);
    expect(await s.remaining()).toBe(3);
    expect(await s.claim("A@x.co")).toEqual({ founder: true, remaining: 2 });
    const [, init] = f.mock.calls[1] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ p_email: "a@x.co", p_total: 50 });
  });
});

describe("/api/paystack founder pricing", () => {
  const envKeys = ["PAYSTACK_SECRET_KEY", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
  const saved = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const k of envKeys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    delete (globalThis as { __founderMemory?: unknown }).__founderMemory;
  });
  const post = (body: unknown) => POST(new Request("http://t/api/paystack", { method: "POST", body: JSON.stringify(body) }));
  const setup = () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_abc";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete (globalThis as { __founderMemory?: unknown }).__founderMemory;
  };

  it("ignores the client's founder flag and prices from the counter", async () => {
    setup();
    const standardClaim = await (await post({ email: "a@x.co", founder: false })).json();
    expect(standardClaim).toMatchObject({ founder: true, amountZar: 99 }); // slots left, so founder regardless of flag
    const forged = await (await post({ email: "b@x.co", founder: true, amountZar: 1 })).json();
    expect(forged.amountZar).toBe(99);
  });

  it("charges the standard price once all 50 slots are gone, even if the client asks for founder", async () => {
    setup();
    for (let i = 0; i < 50; i++) await post({ email: `u${i}@x.co` });
    const res = await (await post({ email: "late@x.co", founder: true })).json();
    expect(res).toMatchObject({ founder: false, amountZar: 149, founderRemaining: 0 });
    // an existing founder keeps the founder price
    expect((await (await post({ email: "u0@x.co" })).json()).amountZar).toBe(99);
  });

  it("GET returns remaining founder slots", async () => {
    setup();
    expect(await (await GET()).json()).toMatchObject({ configured: true, founderSlots: 50, founderRemaining: 50 });
    await post({ email: "a@x.co" });
    expect((await (await GET()).json()).founderRemaining).toBe(49);
  });

  it("validates the email before claiming a slot", async () => {
    setup();
    expect((await post({ email: "nope", founder: true })).status).toBe(400);
    expect((await (await GET()).json()).founderRemaining).toBe(50);
  });

  it("returns 502 instead of a wrong price if the Supabase counter fails", async () => {
    setup();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 500 }));
    expect((await post({ email: "a@x.co", founder: true })).status).toBe(502);
    spy.mockRestore();
  });
});
