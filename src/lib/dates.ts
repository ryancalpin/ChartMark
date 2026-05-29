/**
 * Date-token resolution. @today / @yesterday / @admitdate / @hospitalday all
 * resolve live in draft and lock to a static string at signing — a rolling
 * date in a signed note would be a documentation-integrity violation.
 */

export type DateTokenKind = "today" | "yesterday" | "admitdate" | "hospitalday";

export const DATE_TOKENS: { kind: DateTokenKind; alias: string; label: string }[] = [
  { kind: "today", alias: "today", label: "Today" },
  { kind: "yesterday", alias: "yesterday", label: "Yesterday" },
  { kind: "admitdate", alias: "admitdate", label: "Admit Date" },
  { kind: "hospitalday", alias: "hospitalday", label: "Hospital Day" },
];

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Resolve a date-token kind to its display string at a given "now". */
export function resolveDateToken(kind: DateTokenKind, now: Date, admitDate: string): string {
  switch (kind) {
    case "today":
      return formatDate(now);
    case "yesterday": {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return formatDate(d);
    }
    case "admitdate":
      return formatDate(new Date(admitDate));
    case "hospitalday": {
      const admit = new Date(admitDate);
      const ms = startOfDay(now).getTime() - startOfDay(admit).getTime();
      const day = Math.floor(ms / 86_400_000) + 1; // admit day = HD#1
      return `Hospital Day ${day}`;
    }
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
