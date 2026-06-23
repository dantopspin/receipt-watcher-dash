import { fmtPct, fmtUSD } from "../lib/format";
import { type ItemStat, itemConfidence } from "../lib/inflation";

export function HallOfShameCard({ items, inflation, monthLabel }: {
  items: ItemStat[]; inflation: number; monthLabel: string;
}) {
  return (
    <div className="relative w-full max-w-[360px] overflow-hidden rounded-2xl bg-background p-6 ring-1 ring-border" id="share-card-hos">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest">ReceiptRage</span>
        <span className="size-2 rounded-full bg-accent" />
      </div>
      <h2 className="mt-6 text-2xl font-extrabold leading-tight tracking-tight">
        My Grocery <span className="italic">Hall of Shame</span>
      </h2>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{monthLabel}</p>

      <ul className="mt-6 space-y-3 border-y border-border py-5">
        {items.slice(0, 3).map((it) => (
          <li key={it.key} className="flex items-baseline justify-between gap-4">
            <span className="text-sm font-bold tracking-tight">{it.name}</span>
            <span className="font-mono text-sm">
              <span className="font-bold text-accent">{fmtPct(it.pctChange)}</span>
              <span className="ml-2 text-muted-foreground">+{fmtUSD(Math.max(0, it.dollarChange))}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">My Inflation</p>
          <p className="text-4xl font-extrabold tracking-tighter tab-nums">{fmtPct(inflation)}</p>
        </div>
        <p className="max-w-[140px] text-right text-[10px] font-medium text-muted-foreground">
          Tracking my real prices. Build your own at receiptrage.app
        </p>
      </div>
    </div>
  );
}

export function ItemSpikeCard({ stat, sinceLabel }: { stat: ItemStat; sinceLabel: string }) {
  const conf = itemConfidence(stat);
  const minP = Math.min(...stat.history.map((h) => h.price));
  const maxP = Math.max(...stat.history.map((h) => h.price));
  const range = Math.max(0.0001, maxP - minP);

  const pts = stat.history.map((h, i) => {
    const x = (i / Math.max(1, stat.history.length - 1)) * 100;
    const y = 100 - ((h.price - minP) / range) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="relative w-full max-w-[360px] overflow-hidden rounded-2xl bg-background p-6 ring-1 ring-border" id="share-card-item">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest">ReceiptRage</span>
        <span className="size-2 rounded-full bg-accent" />
      </div>

      <h2 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight">{stat.name}</h2>
      <p className="mt-1 text-base font-bold text-accent">
        Up {fmtPct(stat.pctChange, false)} since {sinceLabel}
      </p>

      <p className="mt-4 text-sm font-medium leading-snug">
        That's <span className="font-extrabold">{fmtUSD(stat.cumulativeOverspend)}</span> more
        out of your pocket in the last 6 months.
      </p>

      <div className="mt-5 rounded-xl border border-border p-3">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-16 w-full">
          <polyline
            points={pts}
            fill="none"
            stroke="hsl(12 92% 52%)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {fmtUSD(stat.firstPrice)} → {fmtUSD(stat.currentPrice)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {conf.label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest">receiptrage.app</span>
      </div>
    </div>
  );
}
