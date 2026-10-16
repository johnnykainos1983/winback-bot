import { AppState } from "./types";
import { DEFAULT_TEMPLATE } from "./templates";

export const DEFAULT_STATE: AppState = {
  contacts: [],
  optOuts: [],
  sentCount: 0,
  plan: "free",
  settings: { business: "", bookingLink: "", template: DEFAULT_TEMPLATE },
};

export interface Storage {
  readonly kind: "local" | "supabase";
  load(): Promise<AppState>;
  save(state: AppState): Promise<void>;
}

const KEY = "winback-bot:v1";

export const localStorageAdapter: Storage = {
  kind: "local",
  async load() {
    if (typeof window === "undefined") return DEFAULT_STATE;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return DEFAULT_STATE;
      const p = JSON.parse(raw) as Partial<AppState>;
      return { ...DEFAULT_STATE, ...p, settings: { ...DEFAULT_STATE.settings, ...(p.settings ?? {}) } };
    } catch {
      return DEFAULT_STATE;
    }
  },
  async save(state) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  },
};
