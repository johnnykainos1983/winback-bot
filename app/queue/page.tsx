"use client";

import Link from "next/link";
import { useApp } from "@/components/AppProvider";
import { IconArrow, IconSkip, IconWhatsApp } from "@/components/Icons";
import { applyOpen, applySent, canOpen, canSend, eligibleContacts, freeRemaining, waLink } from "@/lib/queue";
import { checkServerUsage } from "@/lib/usageClient";
import { isMobile } from "@/lib/phone";
import { buildMessage } from "@/lib/templates";
import { FREE_LIMIT } from "@/lib/types";

export default function QueuePage() {
  const { state, update, ready } = useApp();
  if (!ready) return <p className="p-4 text-steel">Loading...</p>;

  const queue = eligibleContacts(state.contacts, state.optOuts);
  const current = queue[0];
  const remaining = freeRemaining(state.sentCount, state.plan);
  const allowed = canSend(state.sentCount, state.plan);
  const skipped = state.contacts.filter((c) => !c.sent && (!c.consent || state.optOuts.includes(c.phone) || !isMobile(c.phone))).length;
  const linkOk = current ? canOpen(current, state.sentCount, state.plan) : false;

  const message = current
    ? buildMessage(state.settings.template, { name: current.name, job: current.job, business: state.settings.business, bookingLink: state.settings.bookingLink })
    : "";

  function markSent() {
    if (!current) return;
    update((s) => applySent(s, current.id));
  }

  /** Count the send when the link is opened. The server (when signed in) is the authority on the free limit. */
  async function openWhatsApp(e: React.MouseEvent) {
    e.preventDefault();
    if (!current || !linkOk) return;
    const url = waLink(current.phone, message);
    const win = window.open("about:blank", "_blank"); // opened synchronously so popup blockers allow it
    const check = current.opened ? { allowed: true } : await checkServerUsage();
    if (!check.allowed) {
      win?.close();
      update((s) => ({ ...s, sentCount: Math.max(s.sentCount, check.count ?? s.sentCount) }));
      return;
    }
    update((s) => applyOpen(s, current.id, check.count));
    if (win) win.location.href = url;
    else window.location.href = url;
  }

  function skip() {
    if (!current) return;
    // move to the back of the queue by re-inserting contact at end of list
    update((s) => ({ ...s, contacts: [...s.contacts.filter((c) => c.id !== current.id), current] }));
  }

  const pct = (Math.min(state.sentCount, FREE_LIMIT) / FREE_LIMIT) * 100;

  return (
    <>
      <h1 className="text-6xl">Step 3: Send</h1>

      <section className="card space-y-3" aria-label="Queue progress">
        <p className="num text-lg font-semibold">
          <span className="display text-4xl">{queue.length}</span> waiting
          {state.plan === "free" && ` · ${Math.min(remaining, FREE_LIMIT)} of ${FREE_LIMIT} free messages left`}
        </p>
        {state.plan === "free" && (
          <div
            role="progressbar"
            aria-label="Free messages used"
            aria-valuemin={0}
            aria-valuemax={FREE_LIMIT}
            aria-valuenow={Math.min(state.sentCount, FREE_LIMIT)}
            className="meter"
          >
            <div style={{ width: `${pct}%` }} />
          </div>
        )}
        {skipped > 0 && <p className="text-sm font-medium text-warn">{skipped} contacts skipped (no consent, opted out or not a mobile).</p>}
      </section>

      {!allowed && !current?.opened && (
        <section className="card space-y-3 text-center">
          <h2 className="text-5xl">You&apos;ve used your {FREE_LIMIT} free messages</h2>
          <p className="text-steel">Upgrade to keep winning customers back.</p>
          <Link href="/upgrade" className="btn btn-primary w-full">
            See plans
            <IconArrow className="nudge" />
          </Link>
        </section>
      )}

      {allowed && !current && (
        <section className="card space-y-3 text-center">
          <h2 className="text-5xl">{state.contacts.length ? "Queue is empty" : "No contacts yet"}</h2>
          <p className="text-steel">Only contacts with consent (and not opted out) appear here.</p>
          <Link href="/" className="btn btn-ghost w-full">
            Go to contacts
          </Link>
        </section>
      )}

      {current && (allowed || current.opened) && (
        <section className="overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-[0_2px_0_rgba(15,27,45,0.9),0_28px_48px_-24px_rgba(15,27,45,0.55)]" aria-label="Current customer">
          <div className="on-dark surface-ink flex items-center justify-between gap-3 px-5 py-3 text-white">
            <p className="display text-2xl text-hivis">Next customer</p>
            <p className="num text-sm font-semibold text-white/85">{queue.length} left in queue</p>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <p className="display text-5xl">{current.name || "Customer"}</p>
              <p className="num mt-1 text-base text-steel">
                {current.phone}
                {current.job && ` · ${current.job}`}
              </p>
            </div>
            <div className="chat-wall rounded-2xl border border-line p-3.5">
              <div className="bubble">{message}</div>
            </div>
            <div className="border-t-2 border-dashed border-line pt-4">
              {linkOk ? (
                <a href={waLink(current.phone, message)} target="_blank" rel="noopener noreferrer" onClick={(e) => void openWhatsApp(e)} className="btn btn-primary min-h-16 w-full text-xl">
                  <IconWhatsApp className="h-6 w-6" />
                  1. Open WhatsApp
                </a>
              ) : (
                <span aria-disabled="true" className="btn btn-primary min-h-16 w-full cursor-not-allowed text-xl opacity-50">
                  <IconWhatsApp className="h-6 w-6" />
                  1. Open WhatsApp (free limit used)
                </span>
              )}
            </div>
            <button className="btn btn-ink min-h-16 w-full text-xl" onClick={markSent}>
              2. I sent it - next customer
              <IconArrow className="nudge" />
            </button>
            <button className="link-quiet inline-flex min-h-11 w-full items-center justify-center gap-1.5 text-base font-semibold" onClick={skip}>
              <IconSkip className="h-4 w-4" />
              Skip for now
            </button>
          </div>
        </section>
      )}
    </>
  );
}
