import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { PaywallSheet } from "../components/PaywallSheet";
import { useApp } from "../lib/store";
import { aggregateItems } from "../lib/inflation";


export const Route = createFileRoute("/trends")({
  head: () => ({ meta: [{ title: "Spending Trends — ReceiptRage" }] }),
  component: Trends,
});

function Trends() {
  const subscribed = useApp((s) => s.subscribed);
  const scans = useApp((s) => s.scans);
  const [paywall, setPaywall] = useState(false);

  const monthly = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of scans) {
      if (s.source !== "scan") continue;
      const k = s.date.slice(0, 7);
      const sum = s.items.reduce((a, i) => a + i.price, 0);
      m.set(k, (m.get(k) ?? 0) + sum);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [scans]);

  const volatile = useMemo(() => {
    const stats = aggregateItems(scans);
    return stats
      .filter((s) => s.history.length >= 2)
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
      .slice(0, 5);
  }, [scans]);

  const maxSpend = Math.max(1, ...monthly.map(([, v]) => v));

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Spending</p>
        <h1 className="mt-2 text-[34px] font-extrabold leading-[0.95] tracking-[-0.025em]">
          The damage,<br />month over month.
        </h1>

        <div className={`relative mt-8 ${subscribed ? "" : "select-none"}`}>
          <div className={subscribed ? "space-y-6" : "pointer-events-none space-y-6 blur-sm"}>
            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Monthly spend</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground tab-nums">
                  Peak ${Math.round(maxSpend)}
                </p>
              </div>
              <div className="relative mt-5 h-44">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="h-px w-full bg-border/70" />
                  ))}
                </div>
                <div className="relative flex h-full items-end gap-3">
                  {(monthly.length ? monthly : demoMonthly()).map(([k, v]) => {
                    const pct = Math.max(2, (v / Math.max(maxSpend, 1)) * 100);
                    return (
                      <div key={k} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                        <span className="font-mono text-[9px] font-bold tab-nums text-foreground/80">
                          ${Math.round(v)}
                        </span>
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="w-full rounded-t-md bg-gradient-to-t from-accent to-accent/70"
                        />
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{labelMonth(k)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Most volatile</p>
              <ul className="mt-3 space-y-2">
                {(volatile.length ? volatile : demoVolatile()).map((v, i) => (
                  <li key={v.key} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 font-mono text-[11px] font-extrabold tab-nums text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm font-bold tracking-tight">{v.name}</span>
                    <span className={`font-mono text-sm font-extrabold tab-nums ${v.pctChange >= 0 ? "text-accent" : "text-foreground"}`}>
                      {v.pctChange >= 0 ? "+" : ""}{v.pctChange.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Category breakdown</p>
              <div className="mt-4 space-y-3.5">
                {[
                  ["Dairy", 38],
                  ["Meat", 27],
                  ["Produce", 18],
                  ["Pantry", 17],
                ].map(([label, pct]) => (
                  <div key={label as string}>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{label}</span>
                      <span className="font-mono tab-nums text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-foreground"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {!subscribed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-background/60 px-6 text-center backdrop-blur-sm">
              <Lock className="size-8 text-accent" />
              <p className="mt-3 text-2xl font-extrabold tracking-tight">Trends are locked.</p>
              <p className="mt-1 max-w-[28ch] text-sm text-muted-foreground">
                See exactly how your spend shifts month over month, plus what's driving it.
              </p>
              <button
                onClick={() => setPaywall(true)}
                className="mt-5 inline-flex h-12 items-center rounded-full bg-accent px-6 text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/30"
              >
                Unlock — from $3.99
              </button>
            </div>
          )}
        </div>
      </div>

      <PaywallSheet open={paywall} onClose={() => setPaywall(false)} reason="Trends are a paid feature" />
    </AppShell>
  );
}


function labelMonth(yyyyMm: string) {
  const [, m] = yyyyMm.split("-");
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m, 10) - 1];
}
function demoMonthly(): [string, number][] {
  return [["2026-01", 320], ["2026-02", 348], ["2026-03", 372], ["2026-04", 396], ["2026-05", 412], ["2026-06", 438]];
}
function demoVolatile() {
  return [
    { key: "eggs", name: "Eggs", pctChange: 41 },
    { key: "butter", name: "Butter", pctChange: 28 },
    { key: "milk", name: "Whole Milk", pctChange: 18 },
    { key: "chicken-breast", name: "Chicken Breast", pctChange: 12 },
    { key: "bananas", name: "Bananas", pctChange: -3 },
  ];
}
