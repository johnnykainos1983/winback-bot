"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";
import { eligibleContacts, freeRemaining } from "@/lib/queue";

const ITEMS = [
  { href: "/", label: "Contacts", icon: "👥" },
  { href: "/messages", label: "Message", icon: "✏️" },
  { href: "/queue", label: "Send", icon: "💬" },
  { href: "/upgrade", label: "Upgrade", icon: "⭐" },
];

export default function Nav() {
  const path = usePathname();
  const { state } = useApp();
  const left = freeRemaining(state.sentCount, state.plan);
  const waiting = eligibleContacts(state.contacts, state.optOuts).length;
  return (
    <>
      <header className="sticky top-0 z-10 bg-emerald-700 text-white shadow">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold">
            WinBack Bot
          </Link>
          <span className="rounded-full bg-emerald-900/50 px-3 py-1 text-xs font-medium">
            {state.plan === "paid" ? "Paid plan" : `${left} free message${left === 1 ? "" : "s"} left`}
          </span>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {ITEMS.map((i) => {
            const active = path === i.href;
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className={`relative flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                    active ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  <span className="text-xl leading-none">{i.icon}</span>
                  {i.label}
                  {i.href === "/queue" && waiting > 0 && (
                    <span className="absolute right-6 top-1 rounded-full bg-emerald-600 px-1.5 text-[10px] text-white">{waiting}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
