/**
 * Global app chrome state: the detail side panel (opened by linked tokens),
 * display settings (abnormal arrows, staleness thresholds), and a "now" clock
 * that ticks so staleness and relative times stay current without per-token timers.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TokenType } from "../types/tokens";
import { DEFAULT_SETTINGS, type Settings } from "./settings";

export interface DetailTarget {
  type: TokenType;
  dataSourceId: string;
}

interface UiContextValue {
  detail: DetailTarget | null;
  openDetail: (t: DetailTarget) => void;
  closeDetail: () => void;
  settings: Settings;
  setShowArrows: (show: boolean) => void;
  now: Date;
}

const UiContext = createContext<UiContextValue | null>(null);

export function useUi(): UiContextValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [now, setNow] = useState(() => new Date());

  // Tick the clock every 30s so staleness desaturation and "Xh ago" labels
  // advance without each token holding its own interval.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const value = useMemo<UiContextValue>(
    () => ({
      detail,
      openDetail: setDetail,
      closeDetail: () => setDetail(null),
      settings,
      setShowArrows: (show) =>
        setSettings((s) => ({ ...s, showAbnormalArrows: show })),
      now,
    }),
    [detail, settings, now],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}
