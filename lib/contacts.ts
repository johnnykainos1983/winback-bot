import { ColumnMapping } from "./columns";
import { normalisePhone } from "./phone";
import { Table } from "./parse";
import { Contact } from "./types";

export interface BuildResult {
  contacts: Contact[];
  invalid: number;
  duplicates: number;
}

let counter = 0;
const uid = () => `c${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Apply the column mapping, normalise phones, drop invalid, de-dupe by phone (also against `existing`). */
export function buildContacts(table: Table, mapping: ColumnMapping, existing: Contact[] = [], consent = false): BuildResult {
  const seen = new Set(existing.map((c) => c.phone));
  const contacts: Contact[] = [];
  let invalid = 0;
  let duplicates = 0;
  const cell = (r: string[], k: keyof ColumnMapping) => (mapping[k] === undefined ? "" : (r[mapping[k]!] ?? "").trim());
  for (const r of table.rows) {
    const phone = normalisePhone(cell(r, "phone"));
    if (!phone) {
      invalid++;
      continue;
    }
    if (seen.has(phone)) {
      duplicates++;
      continue;
    }
    seen.add(phone);
    contacts.push({ id: uid(), name: cell(r, "name"), phone, job: cell(r, "job"), date: cell(r, "date"), consent, sent: false });
  }
  return { contacts, invalid, duplicates };
}
