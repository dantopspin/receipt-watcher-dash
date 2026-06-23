import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Lock, Share2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { PaywallSheet } from "../components/PaywallSheet";
import { ItemSpikeCard } from "../components/ShareCard";
import { useApp } from "../lib/store";
import { aggregateItems, itemConfidence, withOverspend } from "../lib/inflation";
import { fmtDate, fmtDateLong, fmtPct, fmtUSD } from "../lib/format";

export const Route = createFileRoute("/item/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} — ReceiptRage` }] }),
  component: ItemDetail,
});

function ItemDetail() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const hydrated = useApp((s) => s.hydrated);
  const scans = useApp((s) => s.scans);
  const frequency = useApp((s) => s.frequency);
  const subscribed = useApp((s) => s.subscribed);

  const stat = useMemo(() => {
    const stats = withOverspend(aggregateItems(scans), frequency);
    return stats.find((s) => s.key === id);
  }, [scans, frequency, id]);

  const [paywall, setPaywall] = useState(false);

  if (!hydrated) return <AppShell><div className="p-8" /></AppShell>;
  if (!stat) {
    return (
      <AppShell>
        <div className="px-6 py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Not tracked</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Item not found</h1>
          <Link to="/" className="mt-4 inline-block text-sm font-bold text-accent underline">Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

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
    <AppShell>
      <div className="px-6 pt-4 pb-12">
        <button
          onClick={() => navigate({ to: "/" })}
          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" /> Dashboard
        </button>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight">{stat.name}</h1>
        <p className="mt-2 text-base font-bold text-accent">
          {fmtPct(stat.pctChange)} since {fmtDateLong(stat.firstDate)}
        </p>
        <p className="mt-1 text-sm font-medium">
          That's <span className="font-extrabold tab-nums">{fmtUSD(stat.cumulativeOverspend)}</span> more
          out of your pocket in the last 6 months.
        </p>

        <div className="mt-4">
          <ConfidenceBadge c={conf} />
          {stat.firstFromBaseline && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Estimated baseline — based on your setup
            </p>
          )}
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Price history</p>
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="mt-3 h-24 w-full">
            <polyline points={pts} fill="none" stroke="hsl(12 92% 52%)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">First</p>
              <p className="text-lg font-bold tab-nums">{fmtUSD(stat.firstPrice)}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Latest</p>
              <p className="text-lg font-bold tab-nums">{fmtUSD(stat.currentPrice)}</p>
            </div>
          </div>
          {stat.biggestJumpDate && (
            <p className="mt-3 text-xs text-muted-foreground">
              Biggest single jump: <span className="font-bold text-accent">{fmtPct(stat.biggestJumpPct ?? 0)}</span> on {fmtDate(stat.biggestJumpDate)}.
            </p>
          )}
        </section>

        <section className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">All recorded prices</p>
          <ul className="mt-3 divide-y divide-border">
            {[...stat.history].reverse().map((h, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold tab-nums">{fmtUSD(h.price)}</p>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    {fmtDate(h.date)}{h.fromBaseline ? " • estimated baseline" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <button
          onClick={() => (subscribed ? null : setPaywall(true))}
          className={`mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold uppercase tracking-wider transition-transform active:scale-[0.99] ${
            subscribed ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30" : "border border-border text-foreground"
          }`}
        >
          {subscribed ? <Share2 className="size-4" /> : <Lock className="size-4" />}
          {subscribed ? "Share spike card" : "Unlock spike card"}
        </button>

        {subscribed && (
          <div className="mt-6">
            <ItemSpikeCard stat={stat} sinceLabel={fmtDateLong(stat.firstDate)} />
          </div>
        )}

        <PaywallSheet open={paywall} onClose={() => setPaywall(false)} reason="Share unlocks with paid" />
      </div>
    </AppShell>
  );
}
