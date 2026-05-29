/**
 * Non-hook resolution of a token's *current* value, honoring override and the
 * rolling-date semantics. Used by both the display layer and the sign command
 * (which freezes whatever this returns into signedValue).
 */

import type { TokenAttrs, TokenValue } from "../types/tokens";
import { resolveDateToken } from "./dates";

export interface ResolveOpts {
  getValue: (dataSourceId: string) => { value: TokenValue } | null;
  now: Date;
  admitDate: string;
}

export function resolveCurrentValue(attrs: TokenAttrs, opts: ResolveOpts): TokenValue | null {
  if (attrs.manuallyOverridden && attrs.overrideValue) return attrs.overrideValue;

  if (attrs.type === "date") {
    const kind = attrs.draftValue?.dateKind;
    if (!kind || !attrs.draftValue) return attrs.draftValue;
    return { ...attrs.draftValue, display: resolveDateToken(kind, opts.now, opts.admitDate) };
  }

  if (attrs.dataSourceId) return opts.getValue(attrs.dataSourceId)?.value ?? attrs.draftValue;
  return attrs.draftValue;
}
