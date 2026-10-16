import { Contact, FREE_LIMIT } from "./types";
import { waNumber } from "./phone";

/** Contacts eligible for sending: consented, not opted out, not already sent. */
export function eligibleContacts(contacts: Contact[], optOuts: string[]): Contact[] {
  const blocked = new Set(optOuts);
  return contacts.filter((c) => c.consent && !c.sent && !blocked.has(c.phone));
}

export function freeRemaining(sentCount: number, plan: "free" | "paid"): number {
  return plan === "paid" ? Infinity : Math.max(0, FREE_LIMIT - sentCount);
}

export function canSend(sentCount: number, plan: "free" | "paid"): boolean {
  return freeRemaining(sentCount, plan) > 0;
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(message)}`;
}
