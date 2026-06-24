import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Lock, Share2, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "../components/AppShell";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { PaywallSheet } from "../components/PaywallSheet";
import { Sparkline } from "../components/Sparkline";
import { useApp, realScanCount } from "../lib/store";
import {
  aggregateItems, withOverspend, inflationScore, painIndex, painLabel,
  confidence, totalSpendBaselineVsCurrent,
} from "../lib/inflation";
import { fmtPct, fmtUSD, fmtDate, fmtDateLong } from "../lib/format";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your Inflation — ReceiptRage" },
      { name: "description", content: "Track your personal grocery inflation, item by item, in real dollars." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const hydrated = useApp((s) => s.hydrated);
  const hasOnboarded = useApp((s) => s.hasOnboarded);
  const scans = useApp((s) => s.scans);
  const frequency = useApp((s) => s.frequency);
  const subscribed = useApp((s) => s.subscribed);

  // First-launch routing happens AFTER the first real scan — handled in /scan.
  // Empty state when there are zero scans at all.
  const realCount = realScanCount(scans);

  const stats = useMemo(() => withOverspend(aggregateItems(scans), frequency), [scans, frequency]);
  const inflation = useMemo(() => inflationScore(stats), [stats]);
  const totalDelta = useMemo(() => totalSpendBaselineVsCurrent(stats), [stats]);
  const pain = useMemo(() => painIndex(stats, totalDelta), [stats, totalDelta]);
  const conf = useMemo(() => confidence(scans, stats), [scans, stats]);

  const worst = useMemo(
    () => [...stats].sort((a, b) => b.pctChange - a.pctChange)[0],
    [stats],
  );
  const hallOfShame = useMemo(
    () => [...stats]
      .filter((s) => s.pctChange > 0)
      .sort((a, b) => b.pctChange - a.pctChange)
      .slice(0, 3),
    [stats],
  );

  const recent = useMemo(
    () => [...scans].filter((s) => s.source === "scan").sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
    [scans],
  );

  const firstScanDate = useMemo(() => {
    const real = scans.filter((s) => s.source === "scan").map((s) => s.date).sort();
    return real[0];
  }, [scans]);

  const [paywall, setPaywall] = useState(false);

  // Redirect to empty/onboarding logic — but only after hydration.
  useEffect(() => {
    if (!hydrated) return;
    // No-op; empty state is rendered inline below.
  }, [hydrated]);

  if (!hydrated) return <AppShell><div className="px-6 py-10"><Skeleton /></div></AppShell>;

  if (scans.length === 0) {
    return (
      <AppShell>
        <EmptyState onScan={() => navigate({ to: "/scan" })} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-9 px-6 pt-5">
        {/* Inflation Score */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Personal Inflation
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground tab-nums">
              {monthYear()} · Case #{caseNumber(firstScanDate)}
            </span>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-[76px] font-extrabold leading-[0.85] tracking-[-0.05em] tab-nums">
              {fmtPct(inflation)}
            </span>
            <ArrowUpRight className="mb-2 size-8 text-accent" strokeWidth={2.5} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
            <ConfidenceBadge c={conf} />
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {realCount} {realCount === 1 ? "scan" : "scans"}
              {firstScanDate ? ` · since ${fmtDate(firstScanDate)}` : ""}
            </p>
          </div>
        </motion.section>

        {/* Pain Index */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-border pt-6"
        >
          <div className="mb-4 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Grocery Pain Index
              </h3>
              <p className="mt-1 text-base font-semibold leading-snug tracking-tight">{painLabel(pain)}</p>
            </div>
            <p className="shrink-0 text-4xl font-extrabold tracking-tighter tab-nums leading-none">
              {pain}<span className="text-base font-bold text-muted-foreground">/100</span>
            </p>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }} animate={{ width: `${pain}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
            {/* Tick marks */}
            <div className="pointer-events-none absolute inset-0 flex justify-between px-[1px]">
              {[25, 50, 75].map((t) => (
                <div key={t} style={{ marginLeft: `${t}%` }} className="absolute h-2 w-px bg-background/70" />
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>Calm</span><span>Squeeze</span><span>Pain</span><span>Crisis</span>
          </div>
        </motion.section>

        {/* Worst Offender — Evidence card */}
        {worst && worst.pctChange > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
          >
            <Link
              to="/item/$id" params={{ id: worst.key }}
              className="group relative block overflow-hidden rounded-[20px] bg-foreground text-background ring-1 ring-foreground active:scale-[0.995] transition-transform"
            >
              {/* Top metadata strip */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.22em] text-background/60">
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-accent" /> Exhibit A
                </span>
                <span>File · {worst.key.slice(0, 6).toUpperCase()}</span>
              </div>

              <div className="paper-dark relative px-5 pt-5 pb-6">
                {/* Stamp */}
                <div className="pointer-events-none absolute right-4 top-4 z-10 text-accent">
                  <span className="stamp text-[9px]">Guilty</span>
                </div>

                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-background/60">
                  Worst Offender
                </span>
                <h3 className="mt-1 text-[40px] font-extrabold leading-[0.95] tracking-[-0.025em]">
                  {worst.name}
                </h3>

                {/* Sparkline */}
                <div className="mt-4 h-10 text-accent">
                  <Sparkline points={worst.history} className="h-10 w-full" stroke="currentColor" strokeWidth={2} />
                </div>
                <div className="mt-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-background/45 tab-nums">
                  <span>{fmtUSD(worst.firstPrice)}</span>
                  <span>{fmtUSD(worst.currentPrice)}</span>
                </div>

                {/* Metrics */}
                <div className="mt-5 grid grid-cols-2 gap-x-4 border-t border-white/10 pt-4">
                  <div>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-background/55">Price Spike</span>
                    <span className="mt-0.5 block text-[26px] font-extrabold tracking-tight tab-nums text-accent">{fmtPct(worst.pctChange)}</span>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-background/55">Out of pocket</span>
                    <span className="mt-0.5 block text-[26px] font-extrabold tracking-tight tab-nums">+{fmtUSD(Math.max(0, worst.dollarChange))}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-dashed border-white/15 pt-3">
                  <p className="text-[11px] font-medium italic text-background/75">
                    Killing your budget since {fmtDateLong(worst.firstDate)}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent-foreground">
                    Open <ArrowRight className="size-3" strokeWidth={3} />
                  </span>
                </div>
              </div>
            </Link>
          </motion.section>
        )}

        {/* Hall of Shame */}
        {hallOfShame.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Inflation Hall of Shame
              </h3>
              <button
                onClick={() => {
                  if (!subscribed) return setPaywall(true);
                  navigate({ to: "/share/hall-of-shame" });
                }}
                className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent"
              >
                {subscribed ? <Share2 className="size-3.5" /> : <Lock className="size-3.5" />}
                Share card
              </button>
            </div>

            <ul className="space-y-2.5">
              {hallOfShame.map((it, idx) => (
                <li key={it.key}>
                  <Link
                    to="/item/$id" params={{ id: it.key }}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 active:bg-muted/60 transition-colors"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 font-mono text-base font-extrabold tab-nums text-accent">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold leading-tight tracking-tight">{it.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        +{fmtUSD(it.cumulativeOverspend)} extra · 6 mo
                      </p>
                    </div>
                    <div className="hidden h-6 w-14 text-accent sm:block">
                      <Sparkline points={it.history} className="h-6 w-full" stroke="currentColor" strokeWidth={1.75} withDot={false} />
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[15px] font-extrabold tab-nums text-accent">{fmtPct(it.pctChange)}</p>
                      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                        {it.firstFromBaseline ? "vs. baseline" : "vs. first"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {/* Extra spend statement */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-foreground p-6 text-background"
        >
          <div className="paper-dark absolute inset-0 opacity-80" />
          <div className="relative">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-background/50">
              Wallet damage · this month
            </span>
            <p className="mt-2 text-3xl font-extrabold tracking-[-0.02em] tab-nums text-accent">
              +{fmtUSD(totalDelta)}
            </p>
            <p className="mt-2 text-sm leading-snug text-background/85">
              That's what inflation has cost you vs. your baseline cart.
            </p>
          </div>
        </motion.section>


        {/* Recent scans */}
        <section className="space-y-3 pb-4">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Recent Evidence
          </h3>
          {recent.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No real scans yet. <Link to="/scan" className="font-semibold text-accent underline-offset-2 hover:underline">Scan your first receipt</Link>.
            </p>
          )}
          <ul className="divide-y divide-border">
            {recent.map((s) => {
              const spikes = s.items.length; // rough; detail screen shows real diff
              return (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Receipt className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold">{s.store || "Unknown store"}</p>
                      <p className="font-mono text-[10px] uppercase text-muted-foreground">
                        {fmtDate(s.date)} • {spikes} items
                      </p>
                    </div>
                  </div>
                  <span className="size-2 rounded-full bg-accent" />
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <PaywallSheet open={paywall} onClose={() => setPaywall(false)} reason="Share unlocks with paid" />
    </AppShell>
  );
}

function monthYear() {
  return new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
}
function caseNumber(seed?: string) {
  const base = seed ?? new Date().toISOString();
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return (h % 9000 + 1000).toString();
}


function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-3 w-24 rounded bg-muted" />
      <div className="h-16 w-40 rounded bg-muted" />
      <div className="h-40 w-full rounded-2xl bg-muted" />
      <div className="h-32 w-full rounded-2xl bg-muted" />
    </div>
  );
}

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <div className="px-6 pt-10 pb-20">
      <p className="font-mono text-[10px] uppercase tracking-widest text-accent">No data yet</p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight">
        Your prices.
        <br />Tracked. Receipted. <span className="italic">Quantified.</span>
      </h1>
      <p className="mt-4 max-w-[34ch] text-sm text-muted-foreground">
        Scan any grocery receipt and we'll show you exactly which items have
        spiked — by percent and by dollar.
      </p>
      <button
        onClick={onScan}
        className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-accent px-7 text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-xl shadow-accent/30 active:scale-95 transition-transform"
      >
        Scan your first receipt
        <ArrowRight className="size-4" strokeWidth={3} />
      </button>

      <div className="mt-12 grid grid-cols-3 gap-3">
        {[
          ["Real $", "We track what it actually cost you."],
          ["Real you", "Compared only to your own history."],
          ["On-device", "Receipts never leave your phone."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-border bg-surface p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">{title}</p>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
