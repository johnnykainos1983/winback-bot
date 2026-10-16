"use client";

import { useMemo, useState } from "react";
import { detectColumns, type ColumnMapping, type Field } from "@/lib/columns";
import { buildContacts } from "@/lib/contacts";
import { NOT_MOBILE_MESSAGE, isMobile, normalisePhone } from "@/lib/phone";
import type { Table } from "@/lib/parse";
import type { Contact } from "@/lib/types";

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
        <h2 className="text-lg font-bold">Check your columns</h2>
        <p className="text-sm text-slate-500">We guessed which column is which. Change any that look wrong.</p>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f} className="text-sm font-medium">
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
        <h3 className="font-semibold">
          Preview <span className="text-sm font-normal text-slate-500">(tap a cell to fix it, first 50 rows)</span>
        </h3>
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              {table.headers.map((h, i) => (
                <th key={i} className="px-1 pb-1 font-medium">
                  {h}
                  {FIELDS.filter((f) => mapping[f] === i).map((f) => (
                    <span key={f} className="ml-1 rounded bg-emerald-100 px-1 text-xs text-emerald-800">
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
                <tr key={ri} className={bad ? "bg-red-50" : landline ? "bg-amber-50" : ""}>
                  {table.headers.map((_, ci) => (
                    <td key={ci} className="p-0.5">
                      <input
                        aria-label={`${table.headers[ci]} row ${ri + 1}`}
                        className={`w-full rounded border px-2 py-1.5 ${bad && ci === mapping.phone ? "border-red-400" : "border-slate-200"}`}
                        value={r[ci] ?? ""}
                        onChange={(e) => edit(ri, ci, e.target.value)}
                      />
                      {landline && ci === mapping.phone && <span className="block px-1 text-xs text-amber-700">{NOT_MOBILE_MESSAGE}</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card space-y-3">
        <p className="text-sm">
          <b className="text-emerald-700">{built.contacts.length}</b> valid new contacts
          {built.duplicates > 0 && <> · {built.duplicates} duplicates skipped</>}
          {landlines > 0 && <span className="text-amber-700"> · {landlines} {NOT_MOBILE_MESSAGE} (kept, but not queued)</span>}
          {built.invalid > 0 && <span className="text-red-600"> · {built.invalid} with invalid phone numbers skipped</span>}
        </p>
        {mapping.phone === undefined && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Pick which column holds the phone number.</p>}
        <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
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
          </button>
        </div>
      </div>
    </div>
  );
}
