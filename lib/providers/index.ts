import { MessageProvider } from "./types";
import { whatsappCloud } from "./whatsapp-cloud";
import { sms } from "./sms";

export const providers: Record<string, MessageProvider> = { "whatsapp-cloud": whatsappCloud, sms };

export function providerStatus() {
  return Object.values(providers).map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.isConfigured(),
    active: false, // stubs: never active in this MVP
  }));
}
