/** Planned standard price (R/month), kept in step with PRICE_ZAR.standard. */
export const ROI_PLAN_PRICE_ZAR = 149;

/** Our own starting estimates, not measured results. Every business is different. */
export const ROI_DEFAULTS = { customers: 200, jobValue: 1500, returnRatePct: 3 };

export interface RoiInput {
  customers: number;
  jobValue: number;
  returnRatePct: number;
  planPrice?: number;
}

export interface RoiResult {
  /** Customers expected to come back (whole customers, rounded down). */
  returning: number;
  /** Rands won back: returning customers x average job value. */
  wonBack: number;
  /** Whole months of WinBack that amount would cover at the plan price. */
  monthsPaid: number;
  /** True when the amount covers a full year of the plan. */
  coversYear: boolean;
}

const clean = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function computeRoi({ customers, jobValue, returnRatePct, planPrice = ROI_PLAN_PRICE_ZAR }: RoiInput): RoiResult {
  const rate = Math.min(100, clean(returnRatePct));
  const returning = Math.floor((clean(customers) * rate) / 100 + 1e-9);
  const wonBack = Math.round(returning * clean(jobValue));
  const price = clean(planPrice) || ROI_PLAN_PRICE_ZAR;
  const monthsPaid = Math.floor(wonBack / price);
  return { returning, wonBack, monthsPaid, coversYear: monthsPaid >= 12 };
}

export function formatRand(n: number): string {
  return "R" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
