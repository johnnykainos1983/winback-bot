"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export default function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if (ios && safari) setIosHint(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => {
      setPrompt(null);
      setIosHint(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt && !iosHint) return null;

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else {
      setShowHint((v) => !v);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={install}
        aria-expanded={iosHint && !prompt ? showHint : undefined}
        aria-controls={iosHint && !prompt ? "ios-install-hint" : undefined}
        className="pill bg-hivis font-bold text-ink shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_6px_14px_-6px_rgba(255,212,0,0.8)] hover:brightness-105"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
        </svg>
        Install app
      </button>
      {showHint && !prompt && (
        <p id="ios-install-hint" role="status" className="basis-full rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/15">
          Tap Share, then Add to Home Screen
        </p>
      )}
    </>
  );
}
