/** Small "stale" indicator with the exact draw/measure time in its tooltip. */

interface StaleBadgeProps {
  observedAt: string | undefined;
  relative: string;
}

export function StaleBadge({ observedAt, relative }: StaleBadgeProps) {
  const exact = observedAt ? new Date(observedAt).toLocaleString() : "unknown";
  return (
    <span
      className="ml-1 text-[10px] uppercase tracking-wide opacity-70"
      title={`Drawn ${exact} (${relative})`}
    >
      stale
    </span>
  );
}
