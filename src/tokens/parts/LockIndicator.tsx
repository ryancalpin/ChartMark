/**
 * Lock glyph shown on signed tokens. Its tooltip surfaces the medicolegally
 * important comparison: the value frozen at signing vs. the current chart value
 * (which may have since changed).
 */

import type { TokenAttrs } from "../../types/tokens";
import { useChart } from "../../store/ChartContext";
import { renderTokenPlainText } from "../plainText";

export function LockIndicator({ attrs }: { attrs: TokenAttrs }) {
  const { getValue } = useChart();
  const signed = renderTokenPlainText(attrs);
  const current = attrs.dataSourceId
    ? getValue(attrs.dataSourceId)?.value.display ?? "—"
    : "—";
  return (
    <span
      className="ml-0.5 text-[0.85em] opacity-60"
      data-token-interactive
      title={`Value at signing: ${signed}  —  Current value: ${current}`}
      aria-label="locked"
    >
      🔒
    </span>
  );
}
