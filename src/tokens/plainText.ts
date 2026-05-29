/**
 * Plain-text rendering of a token. Used by the schema's `leafText`, the
 * clipboard text serializer, and print rendering — so copying a note out, or
 * printing it, flattens every token to clean text with its locked/current
 * value and NO metadata (design-doc requirement 13).
 */

import type { TokenAttrs, TokenValue } from "../types/tokens";
import { abnormalArrow } from "../lib/abnormal";

/** Pick the value that should appear in flattened text. */
function flattenedValue(attrs: TokenAttrs): TokenValue | null {
  if (attrs.manuallyOverridden && attrs.overrideValue) return attrs.overrideValue;
  if (attrs.lockState === "locked" && attrs.signedValue) return attrs.signedValue;
  return attrs.draftValue;
}

export function renderTokenPlainText(attrs: TokenAttrs): string {
  const value = flattenedValue(attrs);
  if (!value) return attrs.displayLabel || "[unavailable]";
  const arrow = abnormalArrow(value.abnormal);
  return arrow ? `${value.display} ${arrow}` : value.display;
}
