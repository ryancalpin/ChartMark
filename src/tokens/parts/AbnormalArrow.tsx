/** Directional abnormal-value arrow. Hidden when arrows are disabled in settings. */

import type { AbnormalLevel } from "../../types/tokens";
import { abnormalArrow } from "../../lib/abnormal";
import { useUi } from "../../store/UiContext";

export function AbnormalArrow({ level }: { level: AbnormalLevel | undefined }) {
  const { settings } = useUi();
  if (!settings.showAbnormalArrows) return null;
  const arrow = abnormalArrow(level);
  if (!arrow) return null;
  return (
    <span className="ml-0.5 font-mono font-medium" aria-label={`abnormal: ${level}`}>
      {arrow}
    </span>
  );
}
