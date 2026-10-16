export type Field = "name" | "phone" | "job" | "date";
export type ColumnMapping = Partial<Record<Field, number>>;

const HINTS: Record<Field, string[]> = {
  name: ["name", "full name", "fullname", "first name", "firstname", "customer", "client", "contact", "naam", "given name"],
  phone: ["phone", "mobile", "cell", "cellphone", "cell phone", "tel", "telephone", "whatsapp", "number", "contact number", "phone 1", "phone 1 - value", "foon", "nommer"],
  job: ["job", "last job", "service", "work", "work done", "description", "notes", "note", "task", "type", "job type", "werk"],
  date: ["date", "last job date", "job date", "last service", "last visit", "service date", "visited", "datum", "when"],
};

const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();

function headerScore(header: string, field: Field): number {
  const h = norm(header);
  if (!h) return 0;
  let best = 0;
  for (const hint of HINTS[field]) {
    if (h === hint) best = Math.max(best, 100);
    else if (h.includes(hint) || (hint.length > 3 && hint.includes(h))) best = Math.max(best, 60 + Math.min(hint.length, 20));
  }
  // "last job date" contains both "job" and "date": date wins for date, not job
  if (field === "job" && /date|datum|when/.test(h)) best = 0;
  if (field === "name" && /(job|date|phone|mobile|cell|tel)/.test(h)) best = 0;
  if (field === "phone" && /date/.test(h)) best = 0;
  return best;
}

const PHONE_RE = /^(\+?27|0027|0)?[\s\-().]*\d[\d\s\-().]{7,14}$/;
const DATE_RE = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+[a-z]{3,9}\s+\d{2,4})$/i;

function contentScore(values: string[], field: Field): number {
  const vals = values.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (!vals.length) return 0;
  const frac = (fn: (v: string) => boolean) => vals.filter(fn).length / vals.length;
  switch (field) {
    case "phone":
      return frac((v) => PHONE_RE.test(v) && v.replace(/\D/g, "").length >= 9) * 90;
    case "date":
      return frac((v) => DATE_RE.test(v)) * 90;
    case "name":
      return frac((v) => /^[\p{L}][\p{L}\s'.-]{1,40}$/u.test(v)) * 40;
    case "job":
      return frac((v) => /[a-z]{3,}/i.test(v) && !DATE_RE.test(v) && !PHONE_RE.test(v)) * 20;
  }
}

/**
 * Pure function: given header row and sample data rows, guess which column index
 * holds each field. Each column is used at most once. Missing fields are omitted.
 */
export function detectColumns(headers: string[], rows: string[][] = []): ColumnMapping {
  const sample = rows.slice(0, 25);
  const fields: Field[] = ["phone", "date", "name", "job"];
  const scores: { field: Field; col: number; score: number }[] = [];
  headers.forEach((h, col) => {
    const values = sample.map((r) => r[col] ?? "");
    for (const field of fields) {
      const hs = headerScore(h, field);
      const cs = contentScore(values, field);
      // header match is most trusted; content confirms (or rescues when header is unhelpful)
      const score = hs > 0 ? hs + cs * 0.3 : cs * (field === "phone" || field === "date" ? 0.8 : 0.5);
      if (score >= (field === "name" || field === "job" ? 15 : 40)) scores.push({ field, col, score });
    }
  });
  scores.sort((a, b) => b.score - a.score);
  const mapping: ColumnMapping = {};
  const usedCols = new Set<number>();
  for (const s of scores) {
    if (mapping[s.field] !== undefined || usedCols.has(s.col)) continue;
    mapping[s.field] = s.col;
    usedCols.add(s.col);
  }
  return mapping;
}
