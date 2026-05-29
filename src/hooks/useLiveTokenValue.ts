/**
 * Subscribes a single token to live chart data. While the token is "live" it
 * tracks the current chart value and flips a one-shot `flash` flag when the
 * value changes. Locked or overridden tokens return their frozen value and
 * never subscribe.
 *
 * Note: the live value is intentionally NOT written back into the document.
 * The node's `draftValue` stays as the value-at-first-render (what the audit
 * trail means by that term); signing reads the live value fresh. This keeps
 * data refreshes entirely out of the ProseMirror undo history.
 */

import { useEffect, useRef, useState } from "react";
import type { TokenAttrs, TokenValue } from "../types/tokens";
import { useChart } from "../store/ChartContext";
import { useAudit, buildTokenAuditRecord } from "../store/AuditContext";
import { useNote } from "../store/NoteContext";

export interface LiveTokenState {
  value: TokenValue | null;
  flash: boolean;
  /** True if the live value differs from the value at first render. */
  changedSinceOpen: boolean;
}

export function useLiveTokenValue(attrs: TokenAttrs, actor: string): LiveTokenState {
  const { getValue, subscribe } = useChart();
  const { service: audit } = useAudit();
  const { note } = useNote();

  const isFrozen = attrs.lockState === "locked" || attrs.manuallyOverridden;

  const initial = (): TokenValue | null => {
    if (attrs.manuallyOverridden) return attrs.overrideValue;
    if (attrs.lockState === "locked") return attrs.signedValue;
    if (!attrs.dataSourceId) return attrs.draftValue;
    return getValue(attrs.dataSourceId)?.value ?? attrs.draftValue;
  };

  const [value, setValue] = useState<TokenValue | null>(initial);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFrozen || !attrs.dataSourceId) return;
    const unsub = subscribe(attrs.dataSourceId, (snap) => {
      setValue((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(snap.value)) {
          setFlash(true);
          if (flashTimer.current) clearTimeout(flashTimer.current);
          flashTimer.current = setTimeout(() => setFlash(false), 1200);
          // Record the in-draft change for the audit trail (non-blocking).
          void audit.recordLiveChange(
            buildTokenAuditRecord(note.id, attrs, "live_change", actor),
          );
        }
        return snap.value;
      });
    });
    return () => {
      unsub();
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [attrs, isFrozen, subscribe, audit, note.id, actor]);

  const changedSinceOpen =
    !isFrozen &&
    !!attrs.draftValue &&
    !!value &&
    JSON.stringify(attrs.draftValue) !== JSON.stringify(value);

  return { value, flash, changedSinceOpen };
}
