export const STOP_LINE = "Reply STOP to opt out";

export interface Template {
  id: string;
  label: string;
  body: string;
  /** Same message reworded so it reads naturally when the contact has no job on file. */
  noJobBody: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "miss-you",
    label: "We miss you",
    body: "Hi {name}, it's {business}. We haven't seen you since your {job} and wanted to say hi. Need anything sorted? Book here: {booking_link}",
    noJobBody: "Hi {name}, it's {business}. It's been a while since we last saw you and we wanted to say hi. Need anything sorted? Book here: {booking_link}",
  },
  {
    id: "service",
    label: "Time for a service",
    body: "Hi {name}, {business} here. It's about time for a check-up after your {job}. A quick service now saves big costs later. Book your spot: {booking_link}",
    noJobBody: "Hi {name}, {business} here. It's about time for a check-up. A quick service now saves big costs later. Book your spot: {booking_link}",
  },
  {
    id: "special",
    label: "Returning customer special",
    body: "Hi {name}! {business} is offering returning customers priority booking this month. Thanks for trusting us with your {job}. Book: {booking_link}",
    noJobBody: "Hi {name}! {business} is offering returning customers priority booking this month. Thanks for trusting us with your business. Book: {booking_link}",
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0].body;

export interface TemplateValues {
  name: string;
  job: string;
  business: string;
  bookingLink: string;
}

const KNOWN_TOKENS = ["name", "job", "business", "booking_link"];

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

/** Custom (edited) text with no per-template variant: swap "your {job}" for neutral wording. */
function dropJob(template: string): string {
  return template.replace(/\b(your|the|our)\s+\{job\}/gi, "$1 recent visit").replace(/\{job\}/gi, "your recent visit");
}

/** Fill placeholders (case-insensitive). Missing values degrade gracefully instead of leaving braces. */
export function fillTemplate(template: string, v: TemplateValues): string {
  const job = v.job.trim();
  if (!job) {
    const known = TEMPLATES.find((t) => t.body === template);
    template = known ? known.noJobBody : dropJob(template);
  }
  const map: Record<string, string> = {
    name: firstName(v.name),
    job,
    business: v.business.trim() || "your tradesperson",
    booking_link: v.bookingLink.trim() || "just reply to this message",
  };
  return template.replace(/\{(name|job|business|booking_link)\}/gi, (_, k: string) => map[k.toLowerCase()]);
}

/** Any {token} in the template that is not one of the supported placeholders (returned as written, de-duplicated). */
export function findUnknownTokens(template: string): string[] {
  const found = template.match(/\{[^{}]*\}/g) ?? [];
  return [...new Set(found.filter((t) => !KNOWN_TOKENS.includes(t.slice(1, -1).toLowerCase())))];
}

/** POPIA: every outgoing message must carry the exact opt-out line (case-sensitive). */
export function ensureOptOut(message: string): string {
  if (message.includes(STOP_LINE)) return message;
  return `${message.trimEnd()}\n\n${STOP_LINE}`;
}

export function buildMessage(template: string, v: TemplateValues): string {
  return ensureOptOut(fillTemplate(template, v));
}
