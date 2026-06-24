import { fmtPct, fmtUSD } from "../lib/format";
import { type ItemStat, itemConfidence } from "../lib/inflation";
import { Sparkline } from "./Sparkline";

export function HallOfShameCard({ items, inflation, monthLabel }: {
  items: ItemStat[]; inflation: number; monthLabel: string;
}) {
  const caseNo = Math.abs(hash(monthLabel + items.length)) % 9000 + 1000;
  return (
    <div
      id="share-card-hos"
      className="relative w-full max-w-[360px] overflow-hidden rounded-[20px] bg-background ring-1 ring-border shadow-2xl shadow-foreground/10"
    >
      {/* File-tab header strip */}
      <div className="flex items-center justify-between bg-foreground px-5 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-background">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent" /> ReceiptRage · Dossier
        </span>
        <span className="tab-nums opacity-70">Case #{caseNo}</span>
      </div>

      <div className="paper relative px-6 pt-6 pb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {monthLabel}
        </span>
        <h2 className="mt-2 text-[28px] font-extrabold leading-[0.95] tracking-[-0.025em]">
          My Grocery<br /><span className="italic">Hall of Shame</span>
        </h2>

        {/* Stamp */}
        <div className="pointer-events-none absolute right-5 top-16 text-accent">
          <span className="stamp text-[10px]">Guilty</span>
        </div>

        <ol className="mt-6 divide-y divide-border border-y border-border">
          {items.slice(0, 3).map((it, i) => (
            <li key={it.key} className="flex items-center gap-3 py-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-foreground font-mono text-[11px] font-extrabold tab-nums text-background">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14px] font-bold tracking-tight">{it.name}</span>
              <span className="text-right">
                <span className="block font-mono text-[13px] font-extrabold tab-nums text-accent">{fmtPct(it.pctChange)}</span>
                <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground tab-nums">
                  +{fmtUSD(Math.max(0, it.dollarChange))}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">My Inflation</p>
            <p className="mt-1 text-[42px] font-extrabold leading-none tracking-[-0.04em] tab-nums text-accent">
              {fmtPct(inflation)}
            </p>
          </div>
          <p className="max-w-[130px] text-right text-[10px] font-medium leading-snug text-muted-foreground">
            Tracking my real receipts.<br />
            <span className="font-mono uppercase tracking-[0.14em] text-foreground">receiptrage.app</span>
          </p>
        </div>
      </div>

      {/* Perforated bottom edge */}
      <div className="h-3 w-full" style={{
        backgroundImage: "radial-gradient(circle at 6px 0, var(--color-background) 3.5px, transparent 4px)",
        backgroundSize: "12px 6px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "0 0",
        backgroundColor: "var(--color-foreground)",
      }} />
    </div>
  );
}

export function ItemSpikeCard({ stat, sinceLabel }: { stat: ItemStat; sinceLabel: string }) {
  const conf = itemConfidence(stat);
  const caseNo = Math.abs(hash(stat.key)) % 9000 + 1000;

  return (
    <div
      id="share-card-item"
      className="relative w-full max-w-[360px] overflow-hidden rounded-[20px] bg-background ring-1 ring-border shadow-2xl shadow-foreground/10"
    >
      <div className="flex items-center justify-between bg-foreground px-5 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-background">
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent" /> Exhibit A
        </span>
        <span className="tab-nums opacity-70">File · {caseNo}</span>
      </div>

      <div className="paper relative px-6 pt-6 pb-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Subject
        </span>
        <h2 className="mt-1 text-[32px] font-extrabold leading-[0.95] tracking-[-0.025em]">{stat.name}</h2>
        <p className="mt-2 inline-block rounded-full bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
          Up {fmtPct(stat.pctChange, false)} since {sinceLabel}
        </p>

        <p className="mt-4 text-[13px] font-medium leading-snug">
          That's <span className="font-extrabold tab-nums">{fmtUSD(stat.cumulativeOverspend)}</span> more
          out of your pocket in the last 6 months.
        </p>

        <div className="mt-4 rounded-xl border border-border bg-surface p-3 text-accent">
          <Sparkline points={stat.history} className="h-16 w-full" stroke="currentColor" strokeWidth={2} />
          <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground tab-nums">
            <span>{fmtUSD(stat.firstPrice)}</span>
            <span>{fmtUSD(stat.currentPrice)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em]">
          <span className="text-muted-foreground">{conf.label}</span>
          <span className="text-foreground">receiptrage.app</span>
        </div>
      </div>

      <div className="h-3 w-full" style={{
        backgroundImage: "radial-gradient(circle at 6px 0, var(--color-background) 3.5px, transparent 4px)",
        backgroundSize: "12px 6px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "0 0",
        backgroundColor: "var(--color-foreground)",
      }} />
    </div>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
