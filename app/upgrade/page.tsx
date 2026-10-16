"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { PRICE_ZAR } from "@/lib/paystack";
import { signIn, signOut, supabaseConfigured } from "@/lib/supabase";

interface ProviderInfo {
  id: string;
  label: string;
  configured: boolean;
  active: boolean;
}

export default function UpgradePage() {
  const { state, storageKind, reload } = useApp();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [founderRemaining, setFounderRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/send")
      .then((r) => r.json())
      .then((d) => setProviders(d.providers ?? []))
      .catch(() => {});
    fetch("/api/paystack")
      .then((r) => r.json())
      .then((d) => setFounderRemaining(typeof d.founderRemaining === "number" ? d.founderRemaining : null))
      .catch(() => {});
  }, []);

  // The server decides founder vs standard from its slot counter; nothing about the price is sent from here.
  async function subscribe() {
    setMsg("");
    const res = await fetch("/api/paystack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await res.json();
    setMsg(d.error || d.message || "Done");
    if (typeof d.founderRemaining === "number") setFounderRemaining(d.founderRemaining);
  }

  return (
    <>
      <section className="card space-y-1 text-center">
        <h1 className="text-xl font-bold">Go unlimited</h1>
        <p className="text-slate-600">
          Free plan: {state.sentCount}/10 messages used. Unlimited WhatsApp click-through queue on paid.
        </p>
      </section>

      <section className="rounded-2xl bg-emerald-700 p-5 text-white shadow">
        <p className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900">FOUNDER PRICE - first {PRICE_ZAR.founderSlots} customers{founderRemaining !== null && ` (${founderRemaining} left)`}</p>
        <p className="mt-2 text-4xl font-extrabold">
          R{PRICE_ZAR.founder}
          <span className="text-lg font-medium"> / month</span>
        </p>
        <p className="text-emerald-100">
          then R{PRICE_ZAR.standard}/month. Keep the founder price for as long as you stay.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>✓ Unlimited messages in the send queue</li>
          <li>✓ Unlimited contacts and templates</li>
          <li>✓ POPIA opt-out and consent tools</li>
        </ul>
        <input type="email" className="input mt-4 !text-slate-900" placeholder="your@email.co.za" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn mt-3 w-full bg-white text-emerald-800" onClick={() => void subscribe()}>
          {founderRemaining === 0 ? `Subscribe R${PRICE_ZAR.standard}/month` : `Subscribe (founder price R${PRICE_ZAR.founder}/month while slots last)`}
        </button>
        {msg && <p className="mt-3 rounded-lg bg-black/20 p-3 text-sm">{msg}</p>}
        <p className="mt-3 text-xs text-emerald-200">Payments run in Paystack test mode only in this build.</p>
      </section>

      <section className="card space-y-3">
        <h2 className="font-bold">Paid add-ons (coming soon)</h2>
        <p className="text-sm text-slate-500">Send to everyone at once instead of tapping through the queue.</p>
        <ul className="space-y-2">
          {(providers.length ? providers : [{ id: "w", label: "WhatsApp Cloud API (bulk)", configured: false, active: false }, { id: "s", label: "SMS (bulk)", configured: false, active: false }]).map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-medium">{p.label}</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">{p.active ? "Active" : "Not active"}</span>
            </li>
          ))}
        </ul>
      </section>

      <AccountCard storageKind={storageKind} onChange={reload} />
    </>
  );
}

function AccountCard({ storageKind, onChange }: { storageKind: string; onChange: () => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [configured, setConfigured] = useState(false);
  useEffect(() => setConfigured(supabaseConfigured()), []);

  async function go(signUp: boolean) {
    const r = await signIn(email, pw, signUp);
    setMsg(r.error ?? "Signed in. Your data now syncs to the cloud.");
    if (r.ok) onChange();
  }

  return (
    <section className="card space-y-2">
      <h2 className="font-bold">Account &amp; backup</h2>
      {!configured ? (
        <p className="text-sm text-slate-500">Cloud sync is off. Your data is saved privately on this phone/browser only.</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">Storage: {storageKind === "supabase" ? "cloud (signed in)" : "this device"}</p>
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1" onClick={() => void go(false)}>
              Sign in
            </button>
            <button className="btn btn-ghost flex-1" onClick={() => void go(true)}>
              Sign up
            </button>
          </div>
          <button className="text-sm text-slate-500 underline" onClick={() => { signOut(); onChange(); }}>
            Sign out
          </button>
          {msg && <p className="text-sm">{msg}</p>}
        </>
      )}
    </section>
  );
}
