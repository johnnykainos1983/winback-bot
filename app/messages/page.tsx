"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { STOP_LINE, TEMPLATES, buildMessage, findUnknownTokens } from "@/lib/templates";

export default function MessagesPage() {
  const { state, update, ready } = useApp();
  if (!ready) return <p className="p-4 text-slate-500">Loading...</p>;

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
      <section className="card space-y-3">
        <h1 className="text-xl font-bold">Your message</h1>
        <label className="block text-sm font-medium">
          Your business name
          <input className="input mt-1" placeholder="e.g. Sipho Plumbing" value={settings.business} onChange={(e) => set({ business: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">
          Booking link or WhatsApp number (optional)
          <input className="input mt-1" placeholder="https://..." value={settings.bookingLink} onChange={(e) => set({ bookingLink: e.target.value })} />
        </label>
      </section>

      <section className="card space-y-3">
        <h2 className="font-bold">Pick a style</h2>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button key={t.id} className={`btn ${settings.template === t.body ? "btn-primary" : "btn-ghost"} !min-h-10 !px-4 !py-2 text-sm`} onClick={() => set({ template: t.body })}>
              {t.label}
            </button>
          ))}
        </div>
        <label className="block text-sm font-medium">
          Edit the text. Use {"{name}"}, {"{job}"}, {"{business}"}, {"{booking_link}"}
          <textarea className="input mt-1" rows={5} value={settings.template} onChange={(e) => set({ template: e.target.value })} />
        </label>
        {unknown.length > 0 && (
          <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Unknown placeholder{unknown.length > 1 ? "s" : ""}: {unknown.join(", ")}. {unknown.length > 1 ? "These" : "This"} will be sent as written. Use {"{name}"}, {"{job}"}, {"{business}"} or {"{booking_link}"}.
          </p>
        )}
        {!hasStop && <p className="text-xs text-slate-500">&quot;Reply STOP to opt out&quot; is added automatically to every message (POPIA).</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-bold">Live preview{state.contacts[0] ? ` (for ${state.contacts[0].name || "first contact"})` : " (example)"}</h2>
        <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-[#d9fdd3] p-3 text-[15px] shadow-sm">{preview}</div>
      </section>

      <Link href="/queue" className="btn btn-primary w-full">
        Next: start sending →
      </Link>
    </>
  );
}
