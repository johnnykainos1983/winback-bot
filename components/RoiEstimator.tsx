"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { ROI_DEFAULTS, ROI_PLAN_PRICE_ZAR, computeRoi, formatRand } from "@/lib/roi";

interface FieldProps {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  onChange: (n: number) => void;
}

function Field({ label, hint, value, min, max, step, prefix, suffix, onChange }: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-2.5">
      <div className="flex items-end justify-between gap-3">
        <Label htmlFor={id} className="text-base font-semibold">
          {label}
        </Label>
        <div className="relative w-32 shrink-0">
          {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel">{prefix}</span>}
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            min={min}
            step={step}
            value={Number.isFinite(value) ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
            className={`num h-11 text-right text-lg font-bold ${prefix ? "pl-7" : ""} ${suffix ? "pr-7" : ""}`}
          />
          {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-steel">{suffix}</span>}
        </div>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[Math.min(max, Math.max(min, value))]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        className="roi-slider py-2"
      />
      <p className="hint">{hint}</p>
    </div>
  );
}

export default function RoiEstimator({ className = "" }: { className?: string }) {
  const [customers, setCustomers] = useState<number>(ROI_DEFAULTS.customers);
  const [jobValue, setJobValue] = useState<number>(ROI_DEFAULTS.jobValue);
  const [rate, setRate] = useState<number>(ROI_DEFAULTS.returnRatePct);

  const r = computeRoi({ customers, jobValue, returnRatePct: rate });
  const oneJobMonths = Math.floor(Math.max(0, jobValue) / ROI_PLAN_PRICE_ZAR);

  return (
    <Card className={`gap-0 overflow-hidden rounded-2xl bg-white p-0 ring-line ${className}`}>
      <CardHeader className="gap-1.5 border-b border-line/70 p-5 sm:p-6">
        <Badge variant="secondary" className="w-fit">What could it be worth?</Badge>
        <CardTitle className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
          One returning customer can pay for a whole year
        </CardTitle>
        <CardDescription className="text-base">
          Slide the numbers to match your business. The starting values are our own rough estimates, not results or promises.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-0 p-0 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6 p-5 sm:p-6">
          <Field label="Old customers on your list" hint="Everyone you have quoted or worked for before." value={customers} min={0} max={2000} step={10} onChange={setCustomers} />
          <Field label="Average job value" hint="What a typical job brings in, in Rands." value={jobValue} min={0} max={20000} step={50} prefix="R" onChange={setJobValue} />
          <Field label="Customers who come back" hint="Our estimate: a few in every hundred reply and book. Yours may be higher or lower." value={rate} min={0} max={25} step={0.5} suffix="%" onChange={setRate} />
        </div>

        <div className="on-dark surface-ink flex flex-col justify-center gap-4 p-5 text-white sm:p-6" aria-live="polite">
          <p className="text-base font-semibold text-white/85">If {r.returning} of {Math.max(0, customers)} customers book again, that is</p>
          <p key={r.wonBack} className="pop num font-display text-[4.25rem] font-extrabold leading-[0.9] tracking-[-0.03em] text-hivis sm:text-7xl">
            {formatRand(r.wonBack)}
          </p>
          <p className="text-base text-white/85">won back, from people who already know you.</p>

          <div className="space-y-2 pt-1">
            <Progress value={Math.min(12, r.monthsPaid)} max={12} aria-label="Months of WinBack covered, out of 12" className="gap-0">
            </Progress>
            <p className="text-lg font-bold leading-snug">
              {r.monthsPaid === 0
                ? `Not yet enough to cover a month at R${ROI_PLAN_PRICE_ZAR}. Try a higher job value or more customers.`
                : r.coversYear
                  ? `Covers a full year of WinBack at R${ROI_PLAN_PRICE_ZAR} a month.`
                  : `Pays for ${r.monthsPaid} month${r.monthsPaid === 1 ? "" : "s"} of WinBack at R${ROI_PLAN_PRICE_ZAR} a month.`}
            </p>
            {oneJobMonths > 0 && (
              <p className="text-sm text-white/80">
                Even one {formatRand(jobValue)} job covers {oneJobMonths} month{oneJobMonths === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <div className="hazard" aria-hidden="true" />
    </Card>
  );
}
