import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectColumns } from "@/lib/columns";
import { buildContacts } from "@/lib/contacts";
import { parseFile, parseCsvText, type Table } from "@/lib/parse";
import { isMobile } from "@/lib/phone";
import { eligibleContacts, waLink } from "@/lib/queue";
import { STOP_LINE, TEMPLATES, buildMessage } from "@/lib/templates";

const dir = path.join(import.meta.dirname, "..", "test-fixtures");
const asFile = (name: string, type: string) => new File([readFileSync(path.join(dir, name))], name, { type });

// Expected result for the 31 data rows in test-fixtures (one fully blank row is ignored by the parser).
const EXPECTED_PHONES = [
  "+27821234567", // 082 123 4567
  "+27831234567", // 27831234567
  "+27845550192", // +27 (0)84 555 0192
  "+27723334455", // 0027 72 333 4455
  "+27761234560", // 7.6123456E+8 / numeric 761234560
  "+27827778899", // 082 777 8899 / 083 111 2200
  "+27834567890", // 083 456 7890 ext 2
  "+27215551234", // landline 021
  "+27118884321", // landline 011
  "+27105001122", // landline 010
  "+27823456789", // 082-345-6789
  "+27832223344", // 083.222.3344
  "+27724445566", // (072) 444 5566
  "+27829876543", // 27 82 987 6543
  "+27791239876", // padded with spaces
  "+27313042211", // landline 031
  "+27824567788", // "021 456 7788 / 082 456 7788": the cell number, not the landline
  "+27826001234", // no name on file
  "+27610001234", // 0610001234
];
const LANDLINES = ["+27215551234", "+27118884321", "+27105001122", "+27313042211"];
const INVALID = 8; // blank, "082 123", +44, +1, +263, n/a, 091 range, "call office"
const DUPLICATES = 4; // 0821234567, +27 83 123 4567, 8.45550192E+8, bare 821234567

const VALUES = { name: "Thabo Mokoena", job: "Geyser replacement", business: "Sipho Plumbing", bookingLink: "https://sipho.co.za/book" };

async function run(file: File) {
  const table: Table = file.name.endsWith(".csv") ? parseCsvText(await file.text()) : await parseFile(file);
  const mapping = detectColumns(table.headers, table.rows);
  return { table, mapping, built: buildContacts(table, mapping, [], true) };
}

describe.each([
  ["leads.csv", "text/csv"],
  ["leads.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
])("upload path: %s", (name, type) => {
  it("reads headers and rows, ignoring the blank row", async () => {
    const { table } = await run(asFile(name, type));
    expect(table.headers).toEqual(["Client", "Cell No", "Last Job", "Date of Job", "Suburb", "Notes", "Email"]);
    expect(table.rows).toHaveLength(31);
  });

  it("detects the column mapping", async () => {
    const { mapping } = await run(asFile(name, type));
    expect(mapping).toEqual({ name: 0, phone: 1, job: 2, date: 3 });
  });

  it("builds the exact contacts with invalid and duplicate counts", async () => {
    const { built } = await run(asFile(name, type));
    expect(built.invalid).toBe(INVALID);
    expect(built.duplicates).toBe(DUPLICATES);
    expect(built.contacts.map((c) => c.phone)).toEqual(EXPECTED_PHONES);
    expect(built.contacts).toHaveLength(19);
    for (const c of built.contacts) expect(c.phone).toMatch(/^\+27[1-8]\d{8}$/);
  });

  it("keeps names, jobs and dates from the right columns", async () => {
    const { built } = await run(asFile(name, type));
    const first = built.contacts[0];
    expect(first.name).toBe("Thabo Mokoena");
    expect(first.job).toBe("Geyser replacement");
    expect(first.date).toBeTruthy();
    expect(built.contacts.find((c) => c.phone === "+27826001234")?.name).toBe("");
  });

  it("flags landlines as non-mobile and keeps them out of the eligible queue", async () => {
    const { built } = await run(asFile(name, type));
    const nonMobile = built.contacts.filter((c) => !isMobile(c.phone)).map((c) => c.phone);
    expect(nonMobile).toEqual(LANDLINES);
    const queue = eligibleContacts(built.contacts, []);
    expect(queue).toHaveLength(15);
    expect(queue.every((c) => isMobile(c.phone))).toBe(true);
    expect(queue.some((c) => LANDLINES.includes(c.phone))).toBe(false);
    expect(eligibleContacts(buildContacts((await run(asFile(name, type))).table, { name: 0, phone: 1, job: 2, date: 3 }, [], false).contacts, [])).toHaveLength(0);
  });

  it("builds wa.me links with the encoded message ending with the STOP line", async () => {
    const { built } = await run(asFile(name, type));
    for (const c of eligibleContacts(built.contacts, [])) {
      const message = buildMessage(TEMPLATES[0].body, { ...VALUES, name: c.name, job: c.job });
      const link = waLink(c.phone, message);
      expect(link).toMatch(/^https:\/\/wa\.me\/27\d{9}\?text=.+/);
      expect(link.startsWith(`https://wa.me/${c.phone.slice(1)}?text=`)).toBe(true);
      const decoded = decodeURIComponent(link.split("?text=")[1]);
      expect(decoded).toBe(message);
      expect(decoded.endsWith(STOP_LINE)).toBe(true);
      expect(link.endsWith(encodeURIComponent(STOP_LINE))).toBe(true);
    }
  });
});

describe("csv and xlsx agree", () => {
  it("produce the same phones, names and jobs", async () => {
    const csv = await run(asFile("leads.csv", "text/csv"));
    const xlsx = await run(asFile("leads.xlsx", "application/octet-stream"));
    const pick = (r: typeof csv) => r.built.contacts.map((c) => [c.phone, c.name, c.job]);
    expect(pick(xlsx)).toEqual(pick(csv));
  });

  it("reads Excel date cells as formatted dates", async () => {
    const { built } = await run(asFile("leads.xlsx", "application/octet-stream"));
    expect(built.contacts[0].date).toBe("2024-03-10");
    expect(built.contacts.every((c) => /^\d{4}-\d{2}-\d{2}$/.test(c.date))).toBe(true);
  });
});
