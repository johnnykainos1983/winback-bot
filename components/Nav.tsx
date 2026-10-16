"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import InstallButton from "./InstallButton";
import { IconCheck, LogoMark } from "./Icons";
import { eligibleContacts, freeRemaining } from "@/lib/queue";

const STEPS = [
  { href: "/", label: "Upload" },
  { href: "/messages", label: "Messages" },
  { href: "/queue", label: "Send" },
];

export default function Nav() {
  const path = usePathname();
  const { state } = useApp();
  const left = freeRemaining(state.sentCount, state.plan);
  const waiting = eligibleContacts(state.contacts, state.optOuts).length;
  const current = STEPS.findIndex((s) => s.href === path);

  return (
    <header className="on-dark surface-ink sticky top-0 z-20 text-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-3">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="WinBack Bot home">
          <LogoMark size={34} className="drop-shadow-[0_2px_6px_rgba(255,212,0,0.35)] transition-transform duration-300 group-hover:-rotate-6" />
          <span className="display text-[1.7rem] leading-none tracking-[-0.01em] text-white">
            WinBack<span className="ml-1 text-hivis">Bot</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <InstallButton />
          <Link
            href="/upgrade"
            aria-current={path === "/upgrade" ? "page" : undefined}
            className="pill num border border-white/25 bg-white/5 text-white hover:border-white/50 hover:bg-white/10 aria-[current=page]:border-hivis aria-[current=page]:bg-hivis aria-[current=page]:text-ink"
          >
            {state.plan === "paid" ? "Paid plan" : `${left} free message${left === 1 ? "" : "s"} left`}
          </Link>
        </div>
      </div>
      <nav aria-label="Steps" className="mx-auto max-w-3xl px-4 pb-3.5 pt-3.5">
        <ol className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {STEPS.map((s, i) => {
            const active = i === current;
            const done = current > i;
            return (
              <li key={s.href} className="relative">
                <Link
                  href={s.href}
                  aria-current={active ? "step" : undefined}
                  className={`flex min-h-12 items-center gap-2 rounded-xl px-2.5 py-2 text-base font-bold leading-none transition-[background-color,transform,box-shadow] duration-200 active:scale-[0.98] sm:px-3 ${
                    active
                      ? "bg-hivis text-ink shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_10px_20px_-10px_rgba(255,212,0,0.8)]"
                      : done
                        ? "bg-white/10 text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset] hover:bg-white/15"
                        : "border border-white/25 text-white/85 hover:bg-white/10"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`num grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm ${
                      active ? "bg-ink text-hivis" : done ? "bg-hivis text-ink" : "bg-white/15"
                    }`}
                  >
                    {done ? <IconCheck className="pop h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span>{s.label}</span>
                  {s.href === "/queue" && waiting > 0 && (
                    <span className={`num ml-auto rounded-full px-1.5 py-0.5 text-xs ${active ? "bg-ink text-white" : "bg-hivis text-ink"}`} aria-label={`${waiting} waiting`}>
                      {waiting}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="hazard" aria-hidden="true" />
    </header>
  );
}
