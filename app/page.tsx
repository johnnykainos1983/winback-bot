"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import Uploader from "@/components/Uploader";
import MappingPreview from "@/components/MappingPreview";
import { NOT_MOBILE_MESSAGE, formatPhone, isMobile } from "@/lib/phone";
import type { Table } from "@/lib/parse";
import { IconArrow, IconClose, IconLock, IconShield, IconWhatsApp } from "@/components/Icons";
import RoiEstimator from "@/components/RoiEstimator";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TrustStrip from "@/components/TrustStrip";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function ContactsPage() {
  const { state, update, ready } = useApp();
  const [table, setTable] = useState<Table | null>(null);
  const [notice, setNotice] = useState("");
  const blocked = new Set(state.optOuts);

  if (!ready) return <p className="p-4 text-steel">Loading...</p>;

  if (table) {
    return (
      <MappingPreview
        table={table}
        existing={state.contacts}
        onCancel={() => setTable(null)}
        onConfirm={(contacts, stats) => {
          update((s) => ({ ...s, contacts: [...s.contacts, ...contacts] }));
          setNotice(`Added ${contacts.length} contacts${stats.duplicates ? `, ${stats.duplicates} duplicates skipped` : ""}${stats.invalid ? `, ${stats.invalid} invalid skipped` : ""}.`);
          setTable(null);
        }}
      />
    );
  }

  const toggle = (id: string, key: "consent") =>
    update((s) => ({ ...s, contacts: s.contacts.map((c) => (c.id === id ? { ...c, [key]: !c[key] } : c)) }));
  const remove = (id: string) => update((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id) }));
  const optOut = (phone: string) =>
    update((s) => ({ ...s, optOuts: s.optOuts.includes(phone) ? s.optOuts : [...s.optOuts, phone] }));
  const undoOptOut = (phone: string) => update((s) => ({ ...s, optOuts: s.optOuts.filter((p) => p !== phone) }));

  return (
    <>
      <section className="on-dark surface-ink overflow-hidden rounded-2xl text-white">
        <div className="space-y-5 p-6 sm:p-9">
          <Badge variant="hivis">Built for South African trades</Badge>
          <h1 className="max-w-[16ch] text-[3.4rem] sm:text-7xl">One returning customer can pay for a whole year.</h1>
          <p className="max-w-[40ch] text-lg leading-relaxed text-white/85">
            Your old customers already trust you. Upload your list, pick a message, and send it from your own WhatsApp, one tap per customer. R149 a month, or R99 for our first 50 founders.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#upload" className={buttonVariants({ size: "xl", variant: "hivis" })}>
              Start with your list
              <IconArrow className="nudge" />
            </a>
            <a href="#worth" className={cn(buttonVariants({ size: "xl", variant: "outline" }), "border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white")}>
              See what it could be worth
            </a>
          </div>
          <ul className="grid gap-2 pt-1 text-[15px] font-semibold sm:grid-cols-3">
            {[
              [IconWhatsApp, "Sends from your own WhatsApp number"],
              [IconShield, "POPIA-friendly: consent and STOP built in"],
              [IconLock, "Your list stays on your device (free plan)"],
            ].map(([Icon, t]) => (
              <li key={t as string} className="flex items-start gap-2.5 rounded-xl bg-white/[0.07] p-3 leading-snug shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] ring-1 ring-white/10 transition-colors hover:bg-white/[0.11]">
                {(Icon as typeof IconShield)({ className: "mt-0.5 h-5 w-5 shrink-0 text-hivis" })}
                {t as string}
              </li>
            ))}
          </ul>
        </div>
        <div className="hazard" aria-hidden="true" />
      </section>

      <section id="worth" className="scroll-mt-24">
        <RoiEstimator />
      </section>

      <h2 id="upload" className="display scroll-mt-24 text-4xl">Step 1: Upload your customers</h2>

      {notice && <Badge variant="go" role="status" className="pop h-auto whitespace-normal rounded-xl px-3 py-2 text-sm">{notice}</Badge>}

      <Uploader onTable={(t) => { setNotice(""); setTable(t); }} />

      {state.contacts.length > 0 && (
        <Card className="space-y-3 rounded-2xl bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="num text-4xl">Your contacts <span className="text-steel">({state.contacts.length})</span></h2>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="secondary" size="lg" className="min-h-11 px-4 text-base font-bold" onClick={() => update((s) => ({ ...s, contacts: s.contacts.map((c) => ({ ...c, consent: true })) }))} />
                }
              >
                Mark all as consented
              </TooltipTrigger>
              <TooltipContent>Only tick this if these customers have agreed to hear from you.</TooltipContent>
            </Tooltip>
          </div>
          <ul className="divide-y divide-line">
            {state.contacts.map((c) => {
              const out = blocked.has(c.phone);
              return (
                <li key={c.id} className="row-hover -mx-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold tracking-[-0.005em]">{c.name || "(no name)"}</p>
                    <p className="num truncate text-sm text-steel">
                      {formatPhone(c.phone)}
                      {c.job && ` · ${c.job}`}
                      {c.date && ` · ${c.date}`}
                    </p>
                  </div>
                  {out ? (
                    <Button variant="destructive" size="lg" className="min-h-11 px-3 font-bold" onClick={() => undoOptOut(c.phone)}>
                      Opted out (undo)
                    </Button>
                  ) : (
                    <>
                      <label className="flex min-h-11 items-center gap-2 text-base font-semibold">
                        <input type="checkbox" className="h-6 w-6 accent-go" checked={c.consent} onChange={() => toggle(c.id, "consent")} />
                        Consent
                      </label>
                      <Button variant="link" className="min-h-11 px-1 text-sm text-steel" onClick={() => optOut(c.phone)}>
                        They said STOP
                      </Button>
                    </>
                  )}
                  <button aria-label={`Remove ${c.name}`} className="icon-btn" onClick={() => remove(c.id)}>
                    <IconClose className="h-5 w-5" />
                  </button>
                </li>
              );
            })}
          </ul>
          <Link href="/messages" className={cn(buttonVariants({ size: "xl", variant: "default" }), "w-full")}>
            Next: write your message
            <IconArrow className="nudge" />
          </Link>
        </Card>
      )}

      <OptOutManager />

      <TrustStrip />
    </>
  );
}

function OptOutManager() {
  const { state, update } = useApp();
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  // imported lazily to keep top of file tidy
  const add = async () => {
    const { normalisePhone } = await import("@/lib/phone");
    const p = normalisePhone(val);
    if (!p) return setErr("That doesn't look like a valid SA number.");
    setErr("");
    update((s) => ({ ...s, optOuts: s.optOuts.includes(p) ? s.optOuts : [...s.optOuts, p] }));
    setVal("");
  };
  return (
    <Card className="space-y-3 rounded-2xl bg-white p-5 sm:p-6">
      <h2 className="text-3xl">Opt-out list (POPIA)</h2>
      <p className="hint">If someone replies STOP, add their number here. They will never be added to the send queue.</p>
      <div className="flex gap-2">
        <Input aria-label="Phone number to block" inputMode="tel" placeholder="082 123 4567" value={val} onChange={(e) => setVal(e.target.value)} />
        <Button variant="outline" size="xl" onClick={() => void add()}>
          Block
        </Button>
      </div>
      {err && <p role="alert" className="text-sm font-medium text-danger">{err}</p>}
      {state.optOuts.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {state.optOuts.map((p) => (
            <li key={p} className="num flex items-center gap-1 rounded-full bg-canvas py-1 pl-3 pr-1 text-sm font-medium shadow-[0_1px_0_#fff_inset,0_0_0_1px_var(--color-line)]">
              {formatPhone(p)}
              <button className="grid h-8 w-8 place-items-center rounded-full text-steel transition-colors hover:bg-danger-tint hover:text-danger" aria-label="Remove from opt-out list" onClick={() => update((s) => ({ ...s, optOuts: s.optOuts.filter((x) => x !== p) }))}>
                <IconClose className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
