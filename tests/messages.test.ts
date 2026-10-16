import { describe, expect, it } from "vitest";
import { buildMessage, ensureOptOut } from "@/lib/templates";
import { canSend, eligibleContacts } from "@/lib/queue";
import type { Contact } from "@/lib/types";

const c = (o: Partial<Contact>): Contact => ({ id: "1", name: "A", phone: "+27821234567", job: "", date: "", consent: true, sent: false, ...o });

describe("POPIA opt-out line", () => {
  it("appends when missing, not when present", () => {
    expect(ensureOptOut("Hi")).toMatch(/Reply STOP to opt out$/);
    const once = ensureOptOut("Hi");
    expect(ensureOptOut(once)).toBe(once);
  });
  it("fills placeholders", () => {
    const m = buildMessage("Hi {name}, {business}: {job} {booking_link}", { name: "Thabo Mokoena", job: "geyser", business: "Sipho", bookingLink: "x.co" });
    expect(m).toContain("Hi Thabo, Sipho: geyser x.co");
  });
});

describe("queue rules", () => {
  it("blocks non-consented, opted-out and sent contacts", () => {
    const list = [c({ id: "a" }), c({ id: "b", consent: false }), c({ id: "c", phone: "+27831111111" }), c({ id: "d", sent: true })];
    expect(eligibleContacts(list, ["+27831111111"]).map((x) => x.id)).toEqual(["a"]);
  });
  it("enforces free tier limit of 10", () => {
    expect(canSend(9, "free")).toBe(true);
    expect(canSend(10, "free")).toBe(false);
    expect(canSend(10, "paid")).toBe(true);
  });
});
