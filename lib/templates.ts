export const STOP_LINE = "Reply STOP to opt out";

export const TEMPLATES: { id: string; label: string; body: string }[] = [
  {
    id: "miss-you",
    label: "We miss you",
    body: "Hi {name}, it's {business}. We haven't seen you since your {job} and wanted to say hi. Need anything sorted? Book here: {booking_link}",
  },
  {
    id: "service",
    label: "Time for a service",
    body: "Hi {name}, {business} here. It's about time for a check-up after your {job}. A quick service now saves big costs later. Book your spot: {booking_link}",
  },
  {
    id: "special",
    label: "Returning customer special",
    body: "Hi {name}! {business} is offering returning customers priority booking this month. Thanks for trusting us with your {job}. Book: {booking_link}",
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0].body;

export interface TemplateValues {
  name: string;
  job: string;
  business: string;
  bookingLink: string;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

/** Fill placeholders. Missing values degrade gracefully instead of leaving braces. */
export function fillTemplate(template: string, v: TemplateValues): string {
  const map: Record<string, string> = {
    name: firstName(v.name),
    job: v.job.trim() || "last job",
    business: v.business.trim() || "your tradesperson",
    booking_link: v.bookingLink.trim() || "just reply to this message",
  };
  return template.replace(/\{(name|job|business|booking_link)\}/g, (_, k: string) => map[k]);
}

/** POPIA: every outgoing message must carry an opt-out instruction. */
export function ensureOptOut(message: string): string {
  if (/reply\s+stop\s+to\s+opt\s*out/i.test(message)) return message;
  return `${message.trimEnd()}\n\n${STOP_LINE}`;
}

export function buildMessage(template: string, v: TemplateValues): string {
  return ensureOptOut(fillTemplate(template, v));
}
