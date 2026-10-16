import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface Table {
  headers: string[];
  rows: string[][];
}

const clean = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

function toTable(matrix: unknown[][]): Table {
  const rows = matrix.map((r) => r.map(clean)).filter((r) => r.some(Boolean));
  if (!rows.length) return { headers: [], rows: [] };
  const width = Math.max(...rows.map((r) => r.length));
  const padded = rows.map((r) => [...r, ...Array(width - r.length).fill("")]);
  const first = padded[0];
  // First row is data (not a header) if any cell looks like a phone number
  const looksData = first.some((c) => c.replace(/\D/g, "").length >= 9 && /^[+\d\s\-().]+$/.test(c));
  if (!looksData) return { headers: first.map((h, i) => h || `Column ${i + 1}`), rows: padded.slice(1) };
  return { headers: first.map((_, i) => `Column ${i + 1}`), rows: padded };
}

export function parseCsvText(text: string): Table {
  const res = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
  return toTable(res.data as string[][]);
}

/**
 * Pasted text: CSV/TSV (Google Contacts), or WhatsApp-style lines such as
 * "[12/03/2024, 10:15] Thabo Mokoena: +27 82 123 4567" or "Thabo - 082 123 4567".
 */
export function parsePastedText(text: string): Table {
  const t = text.trim();
  if (!t) return { headers: [], rows: [] };
  const lines = t.split(/\r?\n/).filter((l) => l.trim());
  const delimited = lines.filter((l) => /[,;\t]/.test(l)).length >= lines.length * 0.7;
  if (delimited) {
    const res = Papa.parse<string[]>(t, { skipEmptyLines: true, delimiter: t.includes("\t") ? "\t" : undefined });
    return toTable(res.data as string[][]);
  }
  const phoneRe = /(\+?\d[\d\s\-().]{7,17}\d)/;
  const rows: string[][] = [];
  for (const line of lines) {
    const m = phoneRe.exec(line);
    if (!m) continue;
    const name = line
      .replace(m[0], " ")
      .replace(/^\[[^\]]*\]\s*/, "") // WhatsApp timestamp prefix
      .replace(/^[\s:|-]+|[\s:|-]+$/g, "")
      .trim();
    rows.push([name, m[0].trim()]);
  }
  return { headers: ["Name", "Phone"], rows };
}

export async function parseFile(file: File): Promise<Table> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
    return toTable(matrix);
  }
  return parseCsvText(await file.text());
}
