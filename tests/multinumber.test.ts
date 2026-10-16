import { describe, expect, it } from "vitest";
import { normalisePhone } from "@/lib/phone";

describe("multi-number cells", () => {
  it.each([
    ["0821234567 / 0831112222", "+27821234567"],
    ["0821234567/0831112222", "+27821234567"],
    ["0821234567, 0831112222", "+27821234567"],
    ["0821234567; 0831112222", "+27821234567"],
    ["0821234567 | 0831112222", "+27821234567"],
    ["082-123-4567 ext 2", "+27821234567"],
    ["082 123 4567 ext. 12", "+27821234567"],
    ["0821234567 x2", "+27821234567"],
    ["0821234567x2", "+27821234567"],
    ["011 123 4567 x 22", "+27111234567"],
    ["n/a, 0831112222", "+27831112222"],
    ["12345 / 0831112222", "+27831112222"],
    ["+27 82 123 4567 / +27 83 111 2222", "+27821234567"],
  ])("%s -> %s", (input, expected) => expect(normalisePhone(input)).toBe(expected));

  it("returns null when no part is valid", () => {
    expect(normalisePhone("123 / 456")).toBeNull();
    expect(normalisePhone("call me / text me")).toBeNull();
    expect(normalisePhone(" / ; ")).toBeNull();
  });
});
