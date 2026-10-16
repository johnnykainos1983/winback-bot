import { AppState, Contact, FREE_LIMIT } from "./types";
import { isMobile, waNumber } from "./phone";

/** Contacts eligible for sending: consented, mobile (landlines can't WhatsApp), not opted out, not already sent. */
export function eligibleContacts(contacts: Contact[], optOuts: string[]): Contact[] {
  const blocked = new Set(optOuts);
  return contacts.filter((c) => c.consent && !c.sent && isMobile(c.phone) && !blocked.has(c.phone));
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

/** A contact's link may be opened if it was already counted, or the free allowance is not used up. */
export function canOpen(contact: Contact, sentCount: number, plan: "free" | "paid"): boolean {
  return Boolean(contact.opened) || canSend(sentCount, plan);
}

/**
 * Count a send the moment the wa.me link is opened (once per contact).
 * `serverCount` is the authoritative per-account count when the server enforces the limit.
 */
export function applyOpen(state: AppState, contactId: string, serverCount?: number): AppState {
  const contact = state.contacts.find((c) => c.id === contactId);
  if (!contact || contact.opened) return state;
  if (serverCount === undefined && !canSend(state.sentCount, state.plan)) return state;
  return {
    ...state,
    sentCount: Math.max(state.sentCount + 1, serverCount ?? 0),
    contacts: state.contacts.map((c) => (c.id === contactId ? { ...c, opened: true } : c)),
  };
}

/** "I sent it": mark sent, counting it now only if the link open was not already counted. */
export function applySent(state: AppState, contactId: string): AppState {
  const contact = state.contacts.find((c) => c.id === contactId);
  if (!contact || contact.sent) return state;
  if (!contact.opened && !canSend(state.sentCount, state.plan)) return state;
  return {
    ...state,
    sentCount: contact.opened ? state.sentCount : state.sentCount + 1,
    contacts: state.contacts.map((c) => (c.id === contactId ? { ...c, sent: true, opened: true } : c)),
  };
}
