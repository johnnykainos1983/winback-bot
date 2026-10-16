"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState } from "@/lib/types";
import { DEFAULT_STATE } from "@/lib/storage";
import { getStorage } from "@/lib/supabase";

interface Ctx {
  state: AppState;
  ready: boolean;
  update: (fn: (s: AppState) => AppState) => void;
  storageKind: "local" | "supabase";
  reload: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [kind, setKind] = useState<"local" | "supabase">("local");
  const loaded = useRef(false);

  const reload = useCallback(() => {
    const st = getStorage();
    setKind(st.kind);
    st.load().then((s) => {
      setState(s);
      loaded.current = true;
      setReady(true);
    });
  }, []);

  useEffect(reload, [reload]);

  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => void getStorage().save(state), 300);
    return () => clearTimeout(t);
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  return <AppCtx.Provider value={{ state, ready, update, storageKind: kind, reload }}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}
