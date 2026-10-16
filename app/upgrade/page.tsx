"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { IconCheck } from "@/components/Icons";
import RoiEstimator from "@/components/RoiEstimator";
import TrustStrip from "@/components/TrustStrip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const founderOpen = founderRemaining !== 0;
  const taken = founderRemaining === null ? 0 : PRICE_ZAR.founderSlots - founderRemaining;
  const ROWS: [string, string, string][] = [
    ["Messages in the send queue", "10 total", "Unlimited"],
    ["Contacts and templates", "Unlimited", "Unlimited"],
    ["Sends from your own WhatsApp", "Yes", "Yes"],
    ["POPIA consent and STOP tools", "Yes", "Yes"],
    ["Where your list is saved", "Your device", "Your device, or cloud backup if you sign in"],
    ["Founder price locked in", "No", founderOpen ? "Yes" : "Not available"],
  ];
  const FAQ: [string, string][] = [
    ["What do I get on the free plan?", "10 messages in the send queue, with unlimited contacts and templates, so you can try WinBack on real customers before paying anything."],
    ["How does the founder price work?", `The first ${PRICE_ZAR.founderSlots} customers pay R${PRICE_ZAR.founder} a month and keep that price for as long as they stay. After that the price is R${PRICE_ZAR.standard} a month. The number of slots left is shown above.`],
    ["Does it message everyone automatically?", "No. You tap send for each customer and the message opens in your own WhatsApp. That keeps it personal. Bulk sending is a planned add-on, not available yet."],
    ["Is it POPIA-friendly?", "WinBack gives you a consent tick for each customer and a STOP list that keeps opted-out numbers out of your queue. You still decide who you contact, so only message people who are happy to hear from you. This is not legal advice."],
    ["Where is my customer list kept?", "On the free plan it is saved on your own phone or browser. If you choose to sign in, it can be backed up to the cloud."],
    ["Can I really win customers back?", "It depends on your customers and your message. Many people simply forget to rebook, and a friendly note is an easy nudge. Use the estimator with your own numbers, and treat its starting values as guesses."],
  ];

  return (
    <>
      <section className="space-y-2">
        <h1 className="text-6xl">One job back can cover a year</h1>
        <p className="text-lg text-steel">
          Free plan: <span className="num font-bold text-ink">{state.sentCount}/10</span> messages used. Go unlimited when you are ready.
        </p>
      </section>

      <section className="on-dark surface-ink overflow-hidden rounded-2xl text-white" aria-labelledby="price">
        <div className="space-y-5 p-6 sm:p-8">
          <Badge variant="hivis">Founder price: first {PRICE_ZAR.founderSlots} customers</Badge>
          <div>
            <p className="num flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span id="price" className="font-display text-[5.5rem] font-extrabold leading-[0.9] tracking-[-0.03em]">
                R{PRICE_ZAR.founder}
              </span>
              <span className="text-xl font-medium text-white/85">/ month</span>
              <span className="text-2xl font-semibold text-white/70 line-through decoration-hivis decoration-2" aria-label={`Standard price R${PRICE_ZAR.standard} per month`}>
                R{PRICE_ZAR.standard}
              </span>
            </p>
            <p className="mt-2 text-white/85">
              Standard price is R{PRICE_ZAR.standard}/month. Founders keep R{PRICE_ZAR.founder} for as long as they stay.
            </p>
          </div>

          {founderRemaining !== null ? (
            <div className="space-y-1.5">
              <Progress value={taken} max={PRICE_ZAR.founderSlots} aria-label="Founder slots taken" className="gap-0" />
              <p className="num text-base font-bold">
                {founderRemaining === 0 ? "All founder slots are taken." : `${founderRemaining} of ${PRICE_ZAR.founderSlots} founder slots remaining`}
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-white/85">Limited to the first {PRICE_ZAR.founderSlots} customers.</p>
          )}

          <ul className="space-y-2 text-base font-medium">
            {["Unlimited messages in the send queue", "Unlimited contacts and templates", "POPIA consent and STOP tools"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-hivis text-ink">
                  <IconCheck className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>

          <div className="space-y-1.5">
            <Label htmlFor="sub-email" className="text-base font-semibold">
              Your email
            </Label>
            <Input id="sub-email" type="email" autoComplete="email" className="border-white/20 text-ink" placeholder="your@email.co.za" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button variant="hivis" size="xl" className="w-full" onClick={() => void subscribe()}>
            {founderRemaining === 0 ? `Subscribe R${PRICE_ZAR.standard}/month` : `Claim founder price: R${PRICE_ZAR.founder}/month`}
          </Button>
          {msg && (
            <p role="status" className="pop rounded-xl bg-white/10 p-3 text-sm ring-1 ring-white/15">
              {msg}
            </p>
          )}
          <p className="text-xs text-white/75">Payments run in Paystack test mode only in this build.</p>
        </div>
        <div className="hazard" aria-hidden="true" />
      </section>

      <RoiEstimator />

      <Card className="gap-0 overflow-hidden rounded-2xl bg-white p-5 sm:p-6">
        <h2 id="compare" className="mb-3 text-4xl">
          Free vs Pro
        </h2>
        <Tabs defaultValue="all">
          <TabsList className="mb-3 h-auto">
            <TabsTrigger value="all" className="min-h-10 px-4 text-base">
              Everything
            </TabsTrigger>
            <TabsTrigger value="diff" className="min-h-10 px-4 text-base">
              Only the differences
            </TabsTrigger>
          </TabsList>
          {(["all", "diff"] as const).map((tab) => (
            <TabsContent key={tab} value={tab}>
              <Table className="min-w-[420px] text-base">
                <TableHeader>
                  <TableRow className="border-b-2 border-ink hover:bg-transparent">
                    <TableHead className="h-11 text-base">
                      <span className="sr-only">Feature</span>
                    </TableHead>
                    <TableHead className="h-11 text-base font-bold text-ink">Free</TableHead>
                    <TableHead className="h-11 bg-hivis/25 text-base font-bold text-ink">Pro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROWS.filter(([, f, p]) => tab === "all" || f !== p).map(([f, free, paid]) => (
                    <TableRow key={f} className="row-hover border-line">
                      <TableCell className="whitespace-normal py-3 font-medium">{f}</TableCell>
                      <TableCell className="num whitespace-normal py-3 text-steel">{free}</TableCell>
                      <TableCell className="num whitespace-normal bg-hivis/10 py-3 font-bold text-go">{paid}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      <TrustStrip />

      <Card className="gap-0 rounded-2xl bg-white p-5 sm:p-6">
        <h2 id="faq" className="mb-2 text-4xl">
          Questions people ask
        </h2>
        <Accordion>
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="min-h-12 text-base font-semibold">{q}</AccordionTrigger>
              <AccordionContent className="text-base text-steel">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <Card className="space-y-3 rounded-2xl bg-white p-5 sm:p-6">
        <h2 className="text-4xl">Paid add-ons (coming soon)</h2>
        <p className="hint">Send to everyone at once instead of tapping through the queue.</p>
        <ul className="space-y-2">
          {(providers.length ? providers : [{ id: "w", label: "WhatsApp Cloud API (bulk)", configured: false, active: false }, { id: "s", label: "SMS (bulk)", configured: false, active: false }]).map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-xl bg-canvas p-3 text-base shadow-[0_2px_4px_rgba(15,27,45,0.06)_inset]">
              <span className="font-semibold">{p.label}</span>
              <Badge variant={p.active ? "go" : "outline"}>{p.active ? "Active" : "Not active"}</Badge>
            </li>
          ))}
        </ul>
      </Card>

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
    <Card className="space-y-3 rounded-2xl bg-white p-5 sm:p-6">
      <h2 className="text-4xl">Account &amp; backup</h2>
      {!configured ? (
        <p className="hint">Cloud sync is off. Your data is saved privately on this phone/browser only.</p>
      ) : (
        <>
          <p className="hint">Storage: {storageKind === "supabase" ? "cloud (signed in)" : "this device"}</p>
          <Input type="email" aria-label="Email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" aria-label="Password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="flex gap-2">
            <Button size="xl" className="flex-1" onClick={() => void go(false)}>
              Sign in
            </Button>
            <Button size="xl" variant="outline" className="flex-1" onClick={() => void go(true)}>
              Sign up
            </Button>
          </div>
          <button
            className="hint underline"
            onClick={() => {
              signOut();
              onChange();
            }}
          >
            Sign out
          </button>
          {msg && <p className="text-sm">{msg}</p>}
        </>
      )}
    </Card>
  );
}
