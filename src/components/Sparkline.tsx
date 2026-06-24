type Point = { date: string; price: number };

export function Sparkline({
  points,
  className = "h-8 w-full",
  stroke = "currentColor",
  fill = "none",
  strokeWidth = 1.75,
  withDot = true,
}: {
  points: Point[];
  className?: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  withDot?: boolean;
}) {
  if (!points.length) return <svg className={className} viewBox="0 0 100 30" />;
  const ys = points.map((p) => p.price);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const range = Math.max(0.0001, max - min);
  const coords = points.map((p, i) => {
    const x = (i / Math.max(1, points.length - 1)) * 100;
    const y = 28 - ((p.price - min) / range) * 26 - 1;
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPath = fill !== "none"
    ? `${path} L100,30 L0,30 Z`
    : null;
  const last = coords[coords.length - 1];

  return (
    <svg
      className={className}
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      aria-hidden
    >
      {areaPath && <path d={areaPath} fill={fill} stroke="none" />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {withDot && (
        <circle cx={last[0]} cy={last[1]} r={1.6} fill={stroke} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}
