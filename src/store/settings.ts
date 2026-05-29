/** Provider/system-configurable display settings. */

import { DEFAULT_STALENESS, type StalenessSettings } from "../lib/staleness";

export interface Settings {
  /** Abnormal arrows (↑ ↓ ↑↑) on/off — disableable per design doc req 7. */
  showAbnormalArrows: boolean;
  staleness: StalenessSettings;
}

export const DEFAULT_SETTINGS: Settings = {
  showAbnormalArrows: true,
  staleness: DEFAULT_STALENESS,
};
