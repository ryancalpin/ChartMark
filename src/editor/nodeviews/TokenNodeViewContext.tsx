/**
 * Provider that renders a React portal into each registered token host. Mount
 * this inside all app contexts (Chart/Note/Audit/Ui) so token components see
 * them. The portal's React children are logically children of THIS provider,
 * not of the NodeView's detached DOM — that's what gives them context access.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PortalRegistry, type PortalEntry } from "./portalRegistry";
import { TokenRenderer } from "../../tokens/TokenRenderer";

const RegistryContext = createContext<PortalRegistry | null>(null);

export function usePortalRegistry(): PortalRegistry {
  const reg = useContext(RegistryContext);
  if (!reg) throw new Error("usePortalRegistry must be used within TokenPortalProvider");
  return reg;
}

export function TokenPortalProvider({
  registry,
  children,
}: {
  registry: PortalRegistry;
  children: ReactNode;
}) {
  const [entries, setEntries] = useState<PortalEntry[]>(() => registry.snapshot());

  useEffect(() => registry.subscribe(setEntries), [registry]);

  return (
    <RegistryContext.Provider value={registry}>
      {children}
      {entries.map((entry) =>
        createPortal(
          <TokenRenderer attrs={entry.attrs} view={entry.view} getPos={entry.getPos} />,
          entry.host,
          entry.id,
        ),
      )}
    </RegistryContext.Provider>
  );
}
