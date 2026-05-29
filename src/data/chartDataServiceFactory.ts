import type { ChartDataService } from "./ChartDataService";
import { MockChartDataService } from "./MockChartDataService";
import { EpicChartDataService } from "./EpicChartDataService";

/** Pick the chart data source from env. Defaults to the mock fixture. */
export function createChartDataService(): ChartDataService {
  const source = import.meta.env.VITE_CHART_SOURCE ?? "mock";
  return source === "epic" ? new EpicChartDataService() : new MockChartDataService();
}
