"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { IconArrow, IconCheck } from "@/components/Icons";
import { STOP_LINE, TEMPLATES, buildMessage, findUnknownTokens } from "@/lib/templates";

export default function MessagesPage() {
  const { state, update, ready } = useApp();
  if (!ready) return <p className="p-4 text-steel">Loading...</p>;

  const { settings } = state;
  const set = (patch: Partial<typeof settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const sample = state.contacts[0] ?? { name: "Thabo Mokoena", job: "geyser repair" };
  const preview = buildMessage(settings.template, {
    name: sample.name,
    job: sample.job,
    business: settings.business,
    bookingLink: settings.bookingLink,
  });
  const hasStop = settings.template.includes(STOP_LINE);
  const unknown = findUnknownTokens(settings.template);

  return (
    <>
      <h1 className="text-6xl">Step 2: Your message</h1>

      <section className="card space-y-4" aria-labelledby="biz">
        <h2 id="biz" className="text-3xl">About your business</h2>
        <label className="label">
          Your business name
          <input className="input mt-1 font-normal" placeholder="e.g. Sipho Plumbing" value={settings.business} onChange={(e) => set({ business: e.target.value })} />
        </label>
        <label className="label">
          Booking link or WhatsApp number (optional)
          <input className="input mt-1 font-normal" placeholder="https://..." value={settings.bookingLink} onChange={(e) => set({ bookingLink: e.target.value })} />
        </label>
      </section>

      <section className="card space-y-4" aria-labelledby="style">
        <h2 id="style" className="text-3xl">Pick a style</h2>
        <div role="group" aria-labelledby="style" className="grid gap-2 sm:grid-cols-3">
          {TEMPLATES.map((t) => {
            const on = settings.template === t.body;
            return (
              <button
                key={t.id}
                aria-pressed={on}
                className={`flex min-h-14 items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-base font-bold transition-[transform,border-color,background-color,box-shadow] duration-200 active:scale-[0.98] ${on ? "border-ink bg-gradient-to-b from-[#ffe24d] to-hivis shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_10px_20px_-12px_rgba(255,212,0,0.9)]" : "border-line bg-white shadow-[0_1px_0_#fff_inset] hover:-translate-y-px hover:border-ink"}`}
                onClick={() => set({ template: t.body })}
              >
                {on && <IconCheck className="pop h-4 w-4 shrink-0" />}
                {t.label}
              </button>
            );
          })}
        </div>
        <label className="label">
          Edit the text. Use {"{name}"}, {"{job}"}, {"{business}"}, {"{booking_link}"}
          <textarea className="input mt-1 font-normal" rows={5} value={settings.template} onChange={(e) => set({ template: e.target.value })} />
        </label>
        {unknown.length > 0 && (
          <p role="alert" className="rounded-xl border border-warn/20 bg-warn-tint p-3 text-sm font-medium text-warn">
            Unknown placeholder{unknown.length > 1 ? "s" : ""}: {unknown.join(", ")}. {unknown.length > 1 ? "These" : "This"} will be sent as written. Use {"{name}"}, {"{job}"}, {"{business}"} or {"{booking_link}"}.
          </p>
        )}
        {!hasStop && <p className="hint">&quot;Reply STOP to opt out&quot; is added automatically to every message (POPIA).</p>}
      </section>

      <section className="space-y-2" aria-labelledby="live">
        <h2 id="live" className="text-3xl">
          Live preview<span className="font-sans text-base font-medium text-steel">{state.contacts[0] ? ` (for ${state.contacts[0].name || "first contact"})` : " (example)"}</span>
        </h2>
        <div className="chat-wall rounded-2xl border border-line p-4 sm:p-5" aria-live="polite">
          <div className="bubble">{preview}</div>
        </div>
      </section>

      <Link href="/queue" className="btn btn-primary w-full">
        Next: start sending
        <IconArrow className="nudge" />
      </Link>
    </>
  );
}
