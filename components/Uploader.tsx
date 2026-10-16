"use client";

import { useRef, useState } from "react";
import { parseFile, parsePastedText, type Table } from "@/lib/parse";

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
        onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition ${
          drag ? "border-emerald-600 bg-emerald-50" : "border-slate-300 bg-white"
        }`}
      >
        <span className="text-4xl">📂</span>
        <p className="font-semibold">Tap to choose a file, or drop it here</p>
        <p className="text-sm text-slate-500">Excel (.xlsx) or CSV with your old customers</p>
        <input ref={input} type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />
      </div>

      <div className="card space-y-2">
        <label htmlFor="paste" className="font-semibold">
          Or paste your contacts
        </label>
        <p className="text-sm text-slate-500">From WhatsApp or Google Contacts, one person per line, e.g. &quot;Thabo, 082 123 4567, geyser, 2024-03-10&quot;</p>
        <textarea id="paste" rows={5} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Name, number, last job, date" />
        <button className="btn btn-primary w-full" onClick={handlePaste} disabled={!text.trim()}>
          Read contacts
        </button>
      </div>
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
    </div>
  );
}
