import { BulkMessage, MessageProvider, SendResult } from "./types";

/** STUB. Paid add-on. A real call would POST to graph.facebook.com/<version>/{PHONE_NUMBER_ID}/messages. */
export const whatsappCloud: MessageProvider = {
  id: "whatsapp-cloud",
  label: "WhatsApp Cloud API (bulk)",
  isConfigured: () => Boolean(process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
  async send(messages: BulkMessage[]): Promise<SendResult[]> {
    // Intentionally not implemented: no network calls are made.
    return messages.map((m) => ({ to: m.to, ok: false, error: "WhatsApp Cloud bulk send is a stub and not active" }));
  },
};
