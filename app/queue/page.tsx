"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { canSend, eligibleContacts, freeRemaining, waLink } from "@/lib/queue";
import { buildMessage } from "@/lib/templates";
import { FREE_LIMIT } from "@/lib/types";

export default function QueuePage() {
  const { state, update, ready } = useApp();
  if (!ready) return <p className="p-4 text-slate-500">Loading...</p>;

  const queue = eligibleContacts(state.contacts, state.optOuts);
  const current = queue[0];
  const remaining = freeRemaining(state.sentCount, state.plan);
  const allowed = canSend(state.sentCount, state.plan);
  const skipped = state.contacts.filter((c) => !c.sent && (!c.consent || state.optOuts.includes(c.phone))).length;

  const message = current
    ? buildMessage(state.settings.template, { name: current.name, job: current.job, business: state.settings.business, bookingLink: state.settings.bookingLink })
    : "";

  function markSent() {
    if (!current || !canSend(state.sentCount, state.plan)) return;
    update((s) =>
      canSend(s.sentCount, s.plan)
        ? { ...s, sentCount: s.sentCount + 1, contacts: s.contacts.map((c) => (c.id === current.id ? { ...c, sent: true } : c)) }
        : s,
    );
  }

  function skip() {
    if (!current) return;
    // move to the back of the queue by re-inserting contact at end of list
    update((s) => ({ ...s, contacts: [...s.contacts.filter((c) => c.id !== current.id), current] }));
  }

  return (
    <>
      <section className="card space-y-1">
        <h1 className="text-xl font-bold">Send queue</h1>
        <p className="text-sm text-slate-600">
          {queue.length} waiting
          {state.plan === "free" && ` · ${Math.min(remaining, FREE_LIMIT)} of ${FREE_LIMIT} free messages left`}
        </p>
        {state.plan === "free" && (
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-emerald-600" style={{ width: `${(Math.min(state.sentCount, FREE_LIMIT) / FREE_LIMIT) * 100}%` }} />
          </div>
        )}
        {skipped > 0 && <p className="text-xs text-amber-700">{skipped} contacts skipped (no consent or opted out).</p>}
      </section>

      {!allowed && (
        <section className="card space-y-3 text-center">
          <p className="text-3xl">🎉</p>
          <h2 className="text-lg font-bold">You&apos;ve used your {FREE_LIMIT} free messages</h2>
          <p className="text-slate-600">Upgrade to keep winning customers back.</p>
          <Link href="/upgrade" className="btn btn-primary w-full">
            See plans
          </Link>
        </section>
      )}

      {allowed && !current && (
        <section className="card space-y-3 text-center">
          <p className="text-3xl">✅</p>
          <h2 className="text-lg font-bold">{state.contacts.length ? "Queue is empty" : "No contacts yet"}</h2>
          <p className="text-slate-600">Only contacts with consent (and not opted out) appear here.</p>
          <Link href="/" className="btn btn-ghost w-full">
            Go to contacts
          </Link>
        </section>
      )}

      {allowed && current && (
        <section className="card space-y-3">
          <div>
            <p className="text-lg font-bold">{current.name || "Customer"}</p>
            <p className="text-sm text-slate-500">{current.phone}</p>
          </div>
          <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-[#d9fdd3] p-3 text-[15px]">{message}</div>
          <a href={waLink(current.phone, message)} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full text-lg">
            1. Open WhatsApp
          </a>
          <button className="btn btn-ghost w-full" onClick={markSent}>
            2. I sent it - next customer
          </button>
          <button className="w-full text-sm text-slate-500 underline" onClick={skip}>
            Skip for now
          </button>
        </section>
      )}
    </>
  );
}
