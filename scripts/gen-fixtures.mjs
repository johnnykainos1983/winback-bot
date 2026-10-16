// Generates test-fixtures/leads.csv and test-fixtures/leads.xlsx: the same messy South African
// customer list in two shapes (CSV text with sci-notation phones, XLSX with numeric/date cells).
// Run: node scripts/gen-fixtures.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "test-fixtures");
fs.mkdirSync(outDir, { recursive: true });

const HEADERS = ["Client", "Cell No", "Last Job", "Date of Job", "Suburb", "Notes", "Email"];

// phone: text shown in both files. csvPhone / xlsxPhone override for the shapes Excel really produces
// (sci-notation text in CSV exports, bare numeric cells without the leading 0 in XLSX).
// date: [y, m, d] (XLSX gets a real date cell, CSV gets mixed text formats via csvDate).
const R = (client, phone, job, date, suburb, notes, email, o = {}) => ({ client, phone, job, date, suburb, notes, email, ...o });
const ROWS = [
  R("Thabo Mokoena", "082 123 4567", "Geyser replacement", [2024, 3, 10], "Soweto", "Prefers mornings", "thabo.m@gmail.com"),
  R("Sipho Dlamini", "27831234567", "Blocked drain", [2024, 1, 15], "Umlazi", "", "", { xlsxPhone: 27831234567 }),
  R("Aisha Patel", "+27 (0)84 555 0192", "Bathroom retile", [2023, 11, 2], "Lenasia", "Quoted R18k, \"no rush\"", "aisha@patelhome.co.za"),
  R("Pieter van der Merwe", "0027 72 333 4455", "DB board upgrade", [2024, 5, 21], "Bellville", "Dog in yard", "pieter@vdm.co.za"),
  R("Nomsa Khumalo", "076 123 4560", "Leaking tap", [2024, 2, 8], "Midrand", "", "", { csvPhone: "7.6123456E+8", xlsxPhone: 761234560 }),
  R("Johan Botha", "082 777 8899 / 083 111 2200", "Roof repair", [2022, 9, 30], "Centurion", "Two cells", "johan@botha.co.za"),
  R("Lerato Molefe", "083 456 7890 ext 2", "Gate motor", [2024, 4, 4], "Randburg", "Office line, ask for Lerato", ""),
  R("Zanele Nkosi", "", "Painting", [2023, 7, 19], "Pinetown", "Number missing", ""),
  R("Mr Adams", "021 555 1234", "Aircon service", [2024, 6, 1], "Claremont", "Landline only", ""),
  R("Kobus Venter", "011 888 4321", "Pool pump", [2023, 12, 12], "Sandton", "Landline", "kobus@venter.net"),
  R("Fatima Jacobs", "010 500 1122", "Solar quote", [2024, 8, 3], "Fourways", "Office", ""),
  R("Dumisani", "082 123", "Paving", [2023, 3, 3], "Tembisa", "Half a number", ""),
  R("James Whitfield", "+44 7911 123456", "Kitchen refit", [2023, 10, 5], "Sea Point", "UK landlord", "j.whitfield@example.co.uk"),
  R("Mike Carter", "+1 202 555 0143", "Plumbing", [2023, 6, 14], "Hout Bay", "US number", ""),
  R("Tendai Moyo", "+263 77 123 4567", "Fence repair", [2024, 2, 27], "Rosebank", "Zimbabwe number", ""),
  R("Thabo M", "0821234567", "Geyser service", [2024, 9, 1], "Soweto", "Duplicate of row 1", ""),
  R("Sipho D.", "+27 83 123 4567", "Drain camera", [2024, 9, 9], "Umlazi", "Duplicate of row 2", ""),
  R("Aisha P", "084 555 0192", "Taps", [2024, 7, 7], "Lenasia", "Duplicate of row 3", "", { csvPhone: "8.45550192E+8", xlsxPhone: 845550192 }),
  R("Bheki", "n/a", "Ceiling repair", [2023, 5, 25], "Alberton", "", ""),
  R("Riaan Smit", "082-345-6789", "Alarm install", [2024, 1, 30], "Boksburg", "", "riaan.smit@mweb.co.za"),
  R("Charmaine Adams", "083.222.3344", "Window seals", [2023, 8, 18], "Parow", "", ""),
  R("Yusuf Ebrahim", "(072) 444 5566", "Garage door", [2024, 3, 22], "Fordsburg", "", ""),
  R("Naledi Sithole", "27 82 987 6543", "Tiling", [2024, 6, 14], "Katlehong", "", ""),
  R("Gert Pretorius", "  079 123 9876 ", "Braai area", [2022, 12, 1], "Pretoria East", "Leading spaces", ""),
  R("Priya Naidoo", "031 304 2211", "Burglar bars", [2024, 5, 9], "Westville", "Landline", ""),
  R("Hennie Louw", "021 456 7788 / 082 456 7788", "Deck staining", [2024, 4, 16], "Durbanville", "Landline first, cell second", ""),
  R("", "082 600 1234", "Plumbing", [2024, 7, 29], "Roodepoort", "No name on file", ""),
  R("Mpho Mahlangu", "0610001234", "Rewire", [2023, 9, 6], "Mamelodi", "", "mpho@work.co.za"),
  R("Karabo Sello", "091 234 5678", "Intercom", [2023, 4, 20], "Mitchells Plain", "Not a SA number range", ""),
  R("Walk-in client", "call office", "Plastering", [2024, 8, 12], "Observatory", "", ""),
  R("Thabo Mokoena", "082 123 4567", "Geyser thermostat", [2024, 10, 2], "Soweto", "Duplicate, bare number", "", { csvPhone: "821234567", xlsxPhone: 821234567 }),
];

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");
// CSV exports mix date styles: ISO, SA dd/mm/yyyy and "15 Jan 2024"
const csvDate = ([y, m, d], i) => (i % 3 === 0 ? `${y}-${pad(m)}-${pad(d)}` : i % 3 === 1 ? `${pad(d)}/${pad(m)}/${y}` : `${d} ${MON[m - 1]} ${y}`);

// ---- CSV: UTF-8 BOM + CRLF like an Excel "CSV UTF-8" export, one stray blank line ----
const q = (v) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const lines = [HEADERS.map(q).join(",")];
ROWS.forEach((r, i) => {
  lines.push([r.client, r.csvPhone ?? r.phone, r.job, csvDate(r.date, i), r.suburb, r.notes, r.email].map(q).join(","));
  if (i === 13) lines.push(",,,,,,");
});
fs.writeFileSync(path.join(outDir, "leads.csv"), "﻿" + lines.join("\r\n") + "\r\n", "utf8");

// ---- XLSX: real date cells and numeric phone cells ----
const aoa = [HEADERS];
ROWS.forEach((r, i) => {
  aoa.push([r.client, r.xlsxPhone ?? r.phone, r.job, new Date(Date.UTC(r.date[0], r.date[1] - 1, r.date[2], 12)), r.suburb, r.notes, r.email]);
  if (i === 13) aoa.push(["", "", "", "", "", "", ""]);
});
const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });
aoa.forEach((row, ri) => {
  const date = ws[XLSX.utils.encode_cell({ r: ri, c: 3 })];
  if (ri > 0 && date && date.t === "d") date.z = "yyyy-mm-dd";
  const ph = ws[XLSX.utils.encode_cell({ r: ri, c: 1 })];
  if (ri > 0 && ph && ph.t === "n") ph.z = "0";
});
ws["!cols"] = [22, 30, 22, 14, 18, 36, 28].map((wch) => ({ wch }));
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Customers");
fs.writeFileSync(path.join(outDir, "leads.xlsx"), XLSX.write(wb, { type: "buffer", bookType: "xlsx", cellDates: true }));

console.log(`Wrote ${ROWS.length} rows to ${outDir}`);
