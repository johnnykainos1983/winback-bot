import { BulkMessage, MessageProvider, SendResult } from "./types";

/** STUB. Paid add-on. Plug in a SA SMS gateway here. */
export const sms: MessageProvider = {
  id: "sms",
  label: "SMS (bulk)",
  isConfigured: () => Boolean(process.env.SMS_API_KEY),
  async send(messages: BulkMessage[]): Promise<SendResult[]> {
    return messages.map((m) => ({ to: m.to, ok: false, error: "SMS bulk send is a stub and not active" }));
  },
};
