/** Inline SVG sparkline for lab trends. Oldest → newest, last point marked. */

interface SparklineProps {
  points: { t: string; v: number }[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({ points, width = 140, height = 36, color = "#1A5C9E" }: SparklineProps) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p.v - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });

  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}
