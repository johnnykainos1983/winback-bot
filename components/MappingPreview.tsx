"use client";

import { useMemo, useState } from "react";
import { detectColumns, type ColumnMapping, type Field } from "@/lib/columns";
import { buildContacts } from "@/lib/contacts";
import { NOT_MOBILE_MESSAGE, isMobile, normalisePhone } from "@/lib/phone";
import type { Table } from "@/lib/parse";
import type { Contact } from "@/lib/types";
import { IconArrow } from "./Icons";

const LABELS: Record<Field, string> = { name: "Name", phone: "Phone", job: "Last job", date: "Last job date" };
const FIELDS: Field[] = ["name", "phone", "job", "date"];

export default function MappingPreview({
  table,
  existing,
  onCancel,
  onConfirm,
}: {
  table: Table;
  existing: Contact[];
  onCancel: () => void;
  onConfirm: (contacts: Contact[], stats: { invalid: number; duplicates: number }) => void;
}) {
  const [mapping, setMapping] = useState<ColumnMapping>(() => detectColumns(table.headers, table.rows));
  const [rows, setRows] = useState<string[][]>(table.rows);
  const [consent, setConsent] = useState(false);

  const working: Table = useMemo(() => ({ headers: table.headers, rows }), [table.headers, rows]);
  const built = useMemo(() => buildContacts(working, mapping, existing, consent), [working, mapping, existing, consent]);
  const landlines = useMemo(() => built.contacts.filter((c) => !isMobile(c.phone)).length, [built]);

  function setCol(f: Field, v: string) {
    setMapping((m) => {
      const next = { ...m };
      if (v === "") delete next[f];
      else next[f] = Number(v);
      return next;
    });
  }

  function edit(r: number, c: number, v: string) {
    setRows((rs) => rs.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? v : cell)) : row)));
  }

  const shown = rows.slice(0, 50);

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h2 className="text-3xl">Check your columns</h2>
        <p className="hint">We guessed which column is which. Change any that look wrong.</p>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f} className="label">
              {LABELS[f]}
              <select className="input mt-1" value={mapping[f] ?? ""} onChange={(e) => setCol(f, e.target.value)}>
                <option value="">(none)</option>
                {table.headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="card space-y-2 overflow-x-auto">
        <h3 className="text-2xl">
          Preview <span className="font-sans text-sm font-normal text-steel">(tap a cell to fix it, first 50 rows)</span>
        </h3>
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-steel">
              {table.headers.map((h, i) => (
                <th key={i} className="px-1 pb-1 font-medium">
                  {h}
                  {FIELDS.filter((f) => mapping[f] === i).map((f) => (
                    <span key={f} className="ml-1 rounded-md bg-hivis px-1.5 py-0.5 text-xs font-semibold text-ink shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]">
                      {LABELS[f]}
                    </span>
                  ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, ri) => {
              const norm = mapping.phone !== undefined ? normalisePhone(r[mapping.phone]) : null;
              const bad = mapping.phone !== undefined && !norm;
              const landline = Boolean(norm) && !isMobile(norm!);
              return (
                <tr key={ri} className={bad ? "bg-danger-tint" : landline ? "bg-warn-tint" : ""}>
                  {table.headers.map((_, ci) => (
                    <td key={ci} className="p-0.5">
                      <input
                        aria-label={`${table.headers[ci]} row ${ri + 1}`}
                        className={`w-full rounded-lg border-2 bg-white/80 px-2 py-2 transition-colors hover:border-steel/50 focus:border-ink ${bad && ci === mapping.phone ? "border-danger" : "border-line"}`}
                        value={r[ci] ?? ""}
                        onChange={(e) => edit(ri, ci, e.target.value)}
                      />
                      {landline && ci === mapping.phone && <span className="block px-1 text-xs text-warn">{NOT_MOBILE_MESSAGE}</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card space-y-3">
        <p className="num text-sm">
          <b className="display text-3xl text-go">{built.contacts.length}</b> valid new contacts
          {built.duplicates > 0 && <> · {built.duplicates} duplicates skipped</>}
          {landlines > 0 && <span className="text-warn"> · {landlines} {NOT_MOBILE_MESSAGE} (kept, but not queued)</span>}
          {built.invalid > 0 && <span className="text-danger"> · {built.invalid} with invalid phone numbers skipped</span>}
        </p>
        {mapping.phone === undefined && <p className="rounded-lg bg-warn-tint p-3 text-sm text-amber-800">Pick which column holds the phone number.</p>}
        <label className="flex items-start gap-3 rounded-xl bg-canvas p-3 text-sm shadow-[0_2px_4px_rgba(15,27,45,0.06)_inset]">
          <input type="checkbox" className="mt-1 h-6 w-6 accent-go" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            These customers have <b>agreed to hear from me</b> (they are existing customers who gave me their number). Only contacts with consent can be messaged. You can change this per contact later.
          </span>
        </label>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary flex-1" disabled={!built.contacts.length} onClick={() => onConfirm(built.contacts, { invalid: built.invalid, duplicates: built.duplicates })}>
            Add {built.contacts.length} contacts
            <IconArrow className="nudge" />
          </button>
        </div>
      </div>
    </div>
  );
}
