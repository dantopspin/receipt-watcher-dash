import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Lock, Share2, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "../components/AppShell";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { PaywallSheet } from "../components/PaywallSheet";
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
      <div className="space-y-10 px-6 pt-6">
        {/* Inflation Score */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Your Inflation
          </h2>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[68px] font-extrabold leading-none tracking-tighter tab-nums">
              {fmtPct(inflation)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ConfidenceBadge c={conf} />
            <p className="text-xs text-muted-foreground">
              Based on {realCount} {realCount === 1 ? "scan" : "scans"}
              {firstScanDate ? ` since ${fmtDate(firstScanDate)}` : ""}.
            </p>
          </div>
        </motion.section>

        {/* Pain Index */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-border pt-6"
        >
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Grocery Pain Index
              </h3>
              <p className="mt-1 text-lg font-bold tracking-tight">{painLabel(pain)}</p>
            </div>
            <p className="text-4xl font-extrabold tracking-tighter tab-nums">
              {pain}<span className="text-xl text-muted-foreground">/100</span>
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-accent"
              initial={{ width: 0 }} animate={{ width: `${pain}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.section>

        {/* Worst Offender */}
        {worst && worst.pctChange > 0 && (
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <Link
              to="/item/$id" params={{ id: worst.key }}
              className="group relative block overflow-hidden rounded-2xl bg-accent p-6 text-white shadow-xl shadow-accent/20 ring-1 ring-accent active:scale-[0.99] transition-transform"
            >
              <div className="grain absolute inset-0 opacity-70" />
              <div className="pointer-events-none absolute -right-4 -top-4 select-none font-mono text-8xl font-black uppercase opacity-10 rotate-12">
                Guilty
              </div>
              <div className="relative z-10">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-80">
                  Worst Offender
                </span>
                <h3 className="mt-1 text-4xl font-extrabold tracking-tight">{worst.name}</h3>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <span className="block font-mono text-[10px] uppercase opacity-70">Price Spike</span>
                    <span className="text-2xl font-extrabold tracking-tight tab-nums">{fmtPct(worst.pctChange)}</span>
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase opacity-70">Out of pocket</span>
                    <span className="text-2xl font-extrabold tracking-tight tab-nums">+{fmtUSD(Math.max(0, worst.dollarChange))}</span>
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-white/20 pt-4">
                  <p className="text-xs font-medium italic opacity-90">
                    Killing your budget since {fmtDateLong(worst.firstDate)}
                  </p>
                  <ArrowRight className="size-4 opacity-80 group-active:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.section>
        )}

        {/* Hall of Shame */}
        {hallOfShame.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Inflation Hall of Shame
              </h3>
              <button
                onClick={() => {
                  if (!subscribed) return setPaywall(true);
                  navigate({ to: "/share/hall-of-shame" });
                }}
                className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-accent"
              >
                {subscribed ? <Share2 className="size-3.5" /> : <Lock className="size-3.5" />}
                Share card
              </button>
            </div>

            <ul className="space-y-3">
              {hallOfShame.map((it) => (
                <li key={it.key}>
                  <Link
                    to="/item/$id" params={{ id: it.key }}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 active:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-bold tracking-tight">{it.name}</p>
                      <p className="text-xs text-muted-foreground">
                        +{fmtUSD(it.cumulativeOverspend)} extra this year
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-accent tab-nums">{fmtPct(it.pctChange)}</p>
                      <p className="font-mono text-[10px] uppercase text-muted-foreground">
                        {it.firstFromBaseline ? "vs. baseline" : "vs. first scan"}
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
          transition={{ delay: 0.28, duration: 0.4 }}
          className="rounded-2xl bg-foreground p-6 text-background"
        >
          <p className="text-xl font-medium leading-snug tracking-tight">
            Inflation has cost you an extra{" "}
            <span className="font-extrabold text-accent tab-nums">{fmtUSD(totalDelta)}</span>{" "}
            this month vs. your baseline.
          </p>
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
