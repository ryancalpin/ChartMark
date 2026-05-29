/**
 * Live chart data. Wraps a ChartDataService and exposes synchronous value
 * reads + subscriptions so token components can show live data and flash on
 * change. The service is created once and the scripted live timeline starts
 * after first mount.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Chart } from "../types/chart";
import type { ChartDataService, Unsubscribe, ValueSnapshot } from "../data/ChartDataService";
import { createChartDataService } from "../data/chartDataServiceFactory";

interface ChartContextValue {
  chart: Chart | null;
  service: ChartDataService;
  getValue: (dataSourceId: string) => ValueSnapshot | null;
  subscribe: (dataSourceId: string, cb: (v: ValueSnapshot) => void) => Unsubscribe;
}

const ChartContext = createContext<ChartContextValue | null>(null);

export function useChart(): ChartContextValue {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within ChartProvider");
  return ctx;
}

export function ChartProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => createChartDataService(), []);
  const [chart, setChart] = useState<Chart | null>(null);

  useEffect(() => {
    let active = true;
    void service.getChart().then((c) => {
      if (active) setChart(c);
    });
    // Begin the simulated live updates shortly after mount.
    service.startLiveTimeline?.();
    return () => {
      active = false;
    };
  }, [service]);

  const value = useMemo<ChartContextValue>(
    () => ({
      chart,
      service,
      getValue: (id) => service.getValue(id),
      subscribe: (id, cb) => service.subscribe(id, cb),
    }),
    [chart, service],
  );

  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
}
