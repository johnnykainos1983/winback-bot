export interface Contact {
  id: string;
  name: string;
  phone: string; // E.164 +27...
  job: string;
  date: string; // free text / ISO
  consent: boolean;
  sent: boolean;
  opened?: boolean; // wa.me link opened: already counted against the free limit
}

export interface Settings {
  business: string;
  bookingLink: string;
  template: string;
}

export interface AppState {
  contacts: Contact[];
  optOuts: string[]; // E.164 numbers
  sentCount: number; // lifetime messages marked sent (free tier cap)
  settings: Settings;
  plan: "free" | "paid";
}

export const FREE_LIMIT = 10;
