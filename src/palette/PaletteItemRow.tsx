/** One row in the @ palette: category icon, label, current value + timestamp. */

import type { PaletteItem } from "../types/palette";
import { tokenIcon } from "../tokens/tokenTheme";
import { relativeTime } from "../lib/staleness";

interface Props {
  item: PaletteItem;
  active: boolean;
  now: Date;
  onSelect: () => void;
  onHover: () => void;
  onDisambiguate?: () => void;
}

export function PaletteItemRow({ item, active, now, onSelect, onHover, onDisambiguate }: Props) {
  const drawCount = item.variants?.length ?? 0;
  return (
    <div
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
        active ? "bg-blue-50" : "hover:bg-slate-50"
      }`}
    >
      <button
        data-token-interactive
        onMouseDown={(e) => {
          e.preventDefault(); // keep editor selection so insertion range is intact
          onSelect();
        }}
        className="flex flex-1 items-center gap-2 truncate text-left"
      >
        <span className="w-5 text-center" aria-hidden>
          {tokenIcon(item.type)}
        </span>
        <span className="flex-1 truncate">
          <span className="font-medium text-slate-800">{item.label}</span>
          {item.recentValue && (
            <span className="ml-2 font-mono text-xs text-slate-500">{item.recentValue}</span>
          )}
        </span>
        {item.recentAt && (
          <span className="shrink-0 text-[11px] text-slate-400">{relativeTime(item.recentAt, now)}</span>
        )}
      </button>
      {drawCount > 1 && onDisambiguate ? (
        <button
          data-token-interactive
          onMouseDown={(e) => {
            e.preventDefault();
            onDisambiguate();
          }}
          title="Choose a specific draw"
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200"
        >
          {drawCount} draws ▸
        </button>
      ) : (
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-300">
          {item.category}
        </span>
      )}
    </div>
  );
}
