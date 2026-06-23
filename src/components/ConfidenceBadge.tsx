import { type Confidence } from "../lib/inflation";

export function ConfidenceBadge({ c, size = "sm" }: { c: Confidence; size?: "sm" | "md" }) {
  const colors =
    c.level === "high"
      ? "bg-foreground/10 text-foreground"
      : c.level === "medium"
        ? "bg-accent/10 text-accent"
        : "bg-amber-500/10 text-amber-700";
  const dotColor =
    c.level === "high" ? "bg-foreground" : c.level === "medium" ? "bg-accent" : "bg-amber-500";
  const sz = size === "md" ? "text-[11px] px-2.5 py-1" : "text-[10px] px-2 py-1";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium uppercase tracking-tight ${colors} ${sz}`}>
      <span className={`size-1.5 rounded-full ${dotColor}`} aria-hidden />
      {c.label}
    </span>
  );
}
