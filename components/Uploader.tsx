"use client";

import { useRef, useState } from "react";
import { parseFile, parsePastedText, type Table } from "@/lib/parse";
import { IconUpload } from "./Icons";

export default function Uploader({ onTable }: { onTable: (t: Table) => void }) {
  const [drag, setDrag] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  async function handleFile(f: File | undefined) {
    if (!f) return;
    setErr("");
    try {
      const t = await parseFile(f);
      if (!t.rows.length) return setErr("We couldn't find any rows in that file.");
      onTable(t);
    } catch {
      setErr("Couldn't read that file. Please use a .csv or .xlsx file.");
    }
  }

  function handlePaste() {
    setErr("");
    const t = parsePastedText(text);
    if (!t.rows.length) return setErr("We couldn't find any phone numbers in that text.");
    onTable(t);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Choose a customer file to upload"
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), input.current?.click())}
        className={`group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-[2.5px] border-dashed px-5 py-11 text-center shadow-[0_1px_0_#fff_inset,0_12px_28px_-16px_rgba(15,27,45,0.35)] transition-[background-color,border-color,transform] duration-200 active:scale-[0.995] ${
          drag ? "scale-[1.01] border-ink bg-hivis" : "border-ink/70 bg-gradient-to-b from-white to-paper hover:border-ink hover:from-hivis/25 hover:to-white"
        }`}
      >
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-ink text-hivis shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_10px_20px_-8px_rgba(15,27,45,0.7)] transition-transform duration-300 group-hover:-translate-y-1">
          <IconUpload className="h-8 w-8" />
        </span>
        <p className="display text-[1.9rem]">Tap to choose a file, or drop it here</p>
        <p className="hint">Excel (.xlsx) or CSV with your old customers</p>
        <span className="btn btn-ink mt-1" aria-hidden="true">Choose file</span>
        <input ref={input} type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" tabIndex={-1} onChange={(e) => void handleFile(e.target.files?.[0])} />
      </div>

      <div className="card space-y-3">
        <label htmlFor="paste" className="display block text-2xl">
          Or paste your contacts
        </label>
        <p className="hint">From WhatsApp or Google Contacts, one person per line, e.g. &quot;Thabo, 082 123 4567, geyser, 2024-03-10&quot;</p>
        <textarea id="paste" rows={5} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Name, number, last job, date" />
        <button className="btn btn-primary w-full" onClick={handlePaste} disabled={!text.trim()}>
          Read contacts
        </button>
      </div>
      {err && <p role="alert" className="rounded-xl border border-danger/60 bg-danger-tint p-3 text-sm font-medium text-danger">{err}</p>}
    </div>
  );
}
