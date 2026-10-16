export interface BulkMessage {
  to: string; // E.164
  body: string;
}
export interface SendResult {
  to: string;
  ok: boolean;
  error?: string;
}
export interface MessageProvider {
  readonly id: "whatsapp-cloud" | "sms";
  readonly label: string;
  /** True only when the required env vars are present. */
  isConfigured(): boolean;
  send(messages: BulkMessage[]): Promise<SendResult[]>;
}
