import { describe, expect, it } from "vitest";
import { isMobile, normalisePhone } from "@/lib/phone";
import { buildContacts } from "@/lib/contacts";
import { eligibleContacts } from "@/lib/queue";
import type { Contact } from "@/lib/types";

describe("isMobile", () => {
  it.each(["+27821234567", "+27721234567", "+27611234567", "+27831112222"])("%s is mobile", (p) => expect(isMobile(p)).toBe(true));
  it.each(["+27111234567", "+27211234567", "+27311234567", "+27511234567", "+27911234567", "+27 82", "0821234567", ""])("%s is not mobile", (p) =>
    expect(isMobile(p)).toBe(false),
  );
  it("normalisePhone still accepts landlines", () => {
    expect(normalisePhone("011 123 4567")).toBe("+27111234567");
  });
});

describe("landlines in the queue", () => {
  const c = (o: Partial<Contact>): Contact => ({ id: "1", name: "A", phone: "+27821234567", job: "", date: "", consent: true, sent: false, ...o });
  it("excludes landlines from the send queue", () => {
    const list = [c({ id: "m" }), c({ id: "l", phone: "+27111234567" })];
    expect(eligibleContacts(list, []).map((x) => x.id)).toEqual(["m"]);
  });
  it("buildContacts keeps landlines so the preview can flag them", () => {
    const r = buildContacts({ headers: ["p"], rows: [["0111234567"], ["0821234567"]] }, { phone: 0 });
    expect(r.contacts.map((x) => x.phone)).toEqual(["+27111234567", "+27821234567"]);
  });
});
