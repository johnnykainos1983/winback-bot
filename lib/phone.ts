/**
 * Normalise South African phone numbers to E.164 (+27XXXXXXXXX).
 * Returns null when the number is not a valid SA number.
 * SA national significant numbers are 9 digits and start with 1-8.
 */
export function normalisePhone(input: unknown): string | null {
  if (input === null || input === undefined) return null;
  let s = String(input).trim();
  if (!s) return null;
  // Spreadsheet exports sometimes give floats / sci notation e.g. 8.2123E+8
  if (/^\d+(\.\d+)?e\+?\d+$/i.test(s)) s = String(Math.round(Number(s)));
  if (/[a-z]/i.test(s)) return null;

  const hasPlus = s.startsWith("+");
  let d = s.replace(/\D/g, "");
  if (!d) return null;

  if (d.startsWith("0027")) d = d.slice(4);
  else if (d.startsWith("27") && (hasPlus || d.length >= 11)) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  else if (hasPlus) return null; // other country code
  else if (d.length === 9) {
    // bare national number without leading 0 e.g. 821234567
  } else return null;

  // tolerate "+27 (0) 82 ..." style: a stray 0 after the country code
  if (d.length === 10 && d.startsWith("0")) d = d.slice(1);

  if (!/^[1-8]\d{8}$/.test(d)) return null;
  return "+27" + d;
}

export function isValidPhone(input: unknown): boolean {
  return normalisePhone(input) !== null;
}

/** wa.me wants digits only, no plus. */
export function waNumber(e164: string): string {
  return e164.replace(/\D/g, "");
}

export function formatPhone(e164: string): string {
  const m = /^\+27(\d{2})(\d{3})(\d{4})$/.exec(e164);
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164;
}
