import { describe, expect, it } from "vitest";
import { fillTemplate, findUnknownTokens } from "@/lib/templates";

const v = { name: "Thabo Mokoena", job: "geyser", business: "Sipho Plumbing", bookingLink: "x.co" };

describe("fillTemplate placeholders", () => {
  it("is case-insensitive", () => {
    expect(fillTemplate("{NAME} {Job} {BUSINESS} {Booking_Link}", v)).toBe("Thabo geyser Sipho Plumbing x.co");
  });
  it("leaves unknown tokens as written", () => {
    expect(fillTemplate("Hi {nme}", v)).toBe("Hi {nme}");
  });
});

describe("findUnknownTokens", () => {
  it("returns nothing for known tokens in any case", () => {
    expect(findUnknownTokens("{name} {JOB} {Business} {booking_link}")).toEqual([]);
  });
  it("finds unknown tokens once each", () => {
    expect(findUnknownTokens("Hi {nme}, {foo} and {foo} {name} {booking link}")).toEqual(["{nme}", "{foo}", "{booking link}"]);
  });
  it("returns [] for plain text", () => {
    expect(findUnknownTokens("no tokens")).toEqual([]);
  });
});
