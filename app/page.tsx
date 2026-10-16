"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import Uploader from "@/components/Uploader";
import MappingPreview from "@/components/MappingPreview";
import { formatPhone } from "@/lib/phone";
import type { Table } from "@/lib/parse";

export default function ContactsPage() {
  const { state, update, ready } = useApp();
  const [table, setTable] = useState<Table | null>(null);
  const [notice, setNotice] = useState("");
  const blocked = new Set(state.optOuts);

  if (!ready) return <p className="p-4 text-slate-500">Loading...</p>;

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
      <section className="card space-y-1">
        <h1 className="text-xl font-bold">Bring old customers back</h1>
        <p className="text-slate-600">1. Add your customers · 2. Pick a message · 3. Tap to send on WhatsApp</p>
      </section>

      {notice && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <Uploader onTable={(t) => { setNotice(""); setTable(t); }} />

      {state.contacts.length > 0 && (
        <section className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Your contacts ({state.contacts.length})</h2>
            <button
              className="text-sm font-medium text-emerald-700"
              onClick={() => update((s) => ({ ...s, contacts: s.contacts.map((c) => ({ ...c, consent: true })) }))}
            >
              Mark all as consented
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {state.contacts.map((c) => {
              const out = blocked.has(c.phone);
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name || "(no name)"}</p>
                    <p className="truncate text-sm text-slate-500">
                      {formatPhone(c.phone)}
                      {c.job && ` · ${c.job}`}
                      {c.date && ` · ${c.date}`}
                    </p>
                  </div>
                  {out ? (
                    <button className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700" onClick={() => undoOptOut(c.phone)}>
                      Opted out (undo)
                    </button>
                  ) : (
                    <>
                      <label className="flex items-center gap-1 text-sm">
                        <input type="checkbox" className="h-5 w-5" checked={c.consent} onChange={() => toggle(c.id, "consent")} />
                        Consent
                      </label>
                      <button className="text-xs text-slate-500 underline" onClick={() => optOut(c.phone)}>
                        They said STOP
                      </button>
                    </>
                  )}
                  <button aria-label={`Remove ${c.name}`} className="text-slate-400" onClick={() => remove(c.id)}>
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
          <Link href="/messages" className="btn btn-primary w-full">
            Next: write your message →
          </Link>
        </section>
      )}

      <OptOutManager />
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
    <section className="card space-y-2">
      <h2 className="font-bold">Opt-out list (POPIA)</h2>
      <p className="text-sm text-slate-500">If someone replies STOP, add their number here. They will never be added to the send queue.</p>
      <div className="flex gap-2">
        <input className="input" inputMode="tel" placeholder="082 123 4567" value={val} onChange={(e) => setVal(e.target.value)} />
        <button className="btn btn-ghost" onClick={() => void add()}>
          Block
        </button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {state.optOuts.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {state.optOuts.map((p) => (
            <li key={p} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm">
              {formatPhone(p)}
              <button aria-label="Remove from opt-out list" onClick={() => update((s) => ({ ...s, optOuts: s.optOuts.filter((x) => x !== p) }))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
