import { describe, expect, it } from "vitest";
import { detectColumns } from "@/lib/columns";

describe("detectColumns", () => {
  it("detects by common headers", () => {
    const m = detectColumns(["Customer Name", "Cell", "Last Job", "Last Job Date"], [["Thabo", "0821234567", "Geyser", "2024-03-10"]]);
    expect(m).toEqual({ name: 0, phone: 1, job: 2, date: 3 });
  });

  it("handles Google Contacts export headers", () => {
    const m = detectColumns(["First Name", "Last Name", "Phone 1 - Value"], [["Sipho", "Dlamini", "+27 82 123 4567"]]);
    expect(m.name).toBe(0);
    expect(m.phone).toBe(2);
  });

  it("does not map the job-date column as the job", () => {
    const m = detectColumns(["Name", "Mobile", "Job Date", "Job"], [["A", "0821234567", "2024-01-05", "DB board"]]);
    expect(m.date).toBe(2);
    expect(m.job).toBe(3);
  });

  it("falls back to content when headers are unhelpful", () => {
    const m = detectColumns(["A", "B", "C"], [
      ["Lerato", "082 555 1111", "12/03/2024"],
      ["Pieter", "083 555 2222", "01/11/2023"],
    ]);
    expect(m.phone).toBe(1);
    expect(m.date).toBe(2);
  });

  it("uses each column once and omits missing fields", () => {
    const m = detectColumns(["Name", "Phone"], [["Zanele", "0821234567"]]);
    expect(m).toEqual({ name: 0, phone: 1 });
  });

  it("returns empty mapping for no headers", () => {
    expect(detectColumns([], [])).toEqual({});
  });
});
