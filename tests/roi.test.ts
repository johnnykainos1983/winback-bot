import { describe, expect, it } from "vitest";
import { computeRoi, formatRand, ROI_DEFAULTS } from "../lib/roi";

describe("computeRoi", () => {
  it("multiplies customers x return rate x job value", () => {
    const r = computeRoi({ customers: 200, jobValue: 1500, returnRatePct: 5 });
    expect(r.returning).toBe(10);
    expect(r.wonBack).toBe(15000);
  });

  it("counts months of R149 paid for, rounded down", () => {
    expect(computeRoi({ customers: 100, jobValue: 1000, returnRatePct: 1 }).monthsPaid).toBe(6); // R1000 / 149
    expect(computeRoi({ customers: 100, jobValue: 100, returnRatePct: 1 }).monthsPaid).toBe(0);
  });

  it("flags when one year is covered", () => {
    expect(computeRoi({ customers: 100, jobValue: 1788, returnRatePct: 1 }).coversYear).toBe(true);
    expect(computeRoi({ customers: 100, jobValue: 1787, returnRatePct: 1 }).coversYear).toBe(false);
  });

  it("one returning customer at R2000 a job can cover a year", () => {
    expect(computeRoi({ customers: 100, jobValue: ROI_DEFAULTS.jobValue, returnRatePct: 1 }).coversYear).toBe(false);
    expect(computeRoi({ customers: 100, jobValue: 2000, returnRatePct: 1 }).coversYear).toBe(true);
  });

  it("is safe on bad input", () => {
    const r = computeRoi({ customers: NaN, jobValue: -5, returnRatePct: 400 });
    expect(r).toEqual({ returning: 0, wonBack: 0, monthsPaid: 0, coversYear: false });
    expect(computeRoi({ customers: 10, jobValue: 100, returnRatePct: 400 }).returning).toBe(10);
  });

  it("formats rands with thin spacing", () => {
    expect(formatRand(15000)).toBe("R15 000");
    expect(formatRand(149)).toBe("R149");
  });
});
