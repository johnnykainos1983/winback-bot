import { describe, expect, it } from "vitest";
import { STOP_LINE, buildMessage, ensureOptOut } from "@/lib/templates";

describe("ensureOptOut (exact STOP_LINE)", () => {
  it("leaves a message with the exact line untouched", () => {
    const m = `Hi\n\n${STOP_LINE}`;
    expect(ensureOptOut(m)).toBe(m);
  });
  it.each(["reply stop to opt out", "REPLY STOP TO OPT OUT", "Reply  STOP to opt out", "Reply STOP to optout", "Reply STOP"])(
    "appends the exact line when only a loose variant is present: %s",
    (loose) => {
      const out = ensureOptOut(loose);
      expect(out.endsWith(`\n\n${STOP_LINE}`)).toBe(true);
      expect(out.startsWith(loose)).toBe(true);
    },
  );
  it("is applied by buildMessage", () => {
    expect(buildMessage("Hi {name}", { name: "A", job: "", business: "", bookingLink: "" })).toMatch(/Reply STOP to opt out$/);
  });
});
