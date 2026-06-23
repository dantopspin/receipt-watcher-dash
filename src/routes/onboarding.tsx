import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Check } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { STAPLES } from "../lib/seed";
import { useApp, type Frequency, type Scan } from "../lib/store";
import { fmtUSD } from "../lib/format";
import { subDays } from "date-fns";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Build your baseline — ReceiptRage" }] }),
  component: Onboarding,
});

const FREQS: { id: Frequency; label: string; sub: string }[] = [
  { id: "multi-week", label: "Multiple times per week", sub: "Grab-and-go shopper" },
  { id: "weekly", label: "About once a week", sub: "Standard cadence" },
  { id: "biweekly", label: "Every two weeks", sub: "Big-cart shopper" },
  { id: "monthly", label: "About once a month", sub: "Bulk shopper" },
];

function Onboarding() {
  const navigate = useNavigate();
  const completeOnboarding = useApp((s) => s.completeOnboarding);
  const setNotifications = useApp((s) => s.setNotifications);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [freq, setFreq] = useState<Frequency | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>(
    Object.fromEntries(STAPLES.map((s) => [s.id, s.avgPrice.toFixed(2)])),
  );

  const fillAverages = () => {
    setPrices((p) => {
      const next = { ...p };
      for (const s of STAPLES) if (!next[s.id] || Number.isNaN(parseFloat(next[s.id]))) next[s.id] = s.avgPrice.toFixed(2);
      return next;
    });
  };

  const saveBaseline = () => {
    if (!freq) return;
    const ninetyDaysAgo = subDays(new Date(), 90).toISOString();
    const items = STAPLES
      .map((s) => {
        const v = parseFloat(prices[s.id]);
        if (!Number.isFinite(v) || v <= 0) return null;
        return {
          itemKey: s.id,
          name: s.name,
          rawName: s.name.toUpperCase(),
          price: v,
        };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);

    const baseline: Scan = {
      id: "baseline-" + Date.now(),
      date: ninetyDaysAgo,
      store: "Baseline estimate",
      items,
      source: "baseline_estimate",
    };
    completeOnboarding(freq, baseline);
    setStep(3);
  };

  return (
    <AppShell hideTabs>
      <div className="px-6 pt-4 pb-12">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-muted"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-10"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Step 1 of 2</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              How often do you buy groceries?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We use this to estimate the real dollar damage over time.
            </p>

            <ul className="mt-6 space-y-2.5">
              {FREQS.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => setFreq(f.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                      freq === f.id ? "border-accent bg-accent/5" : "border-border bg-surface"
                    }`}
                  >
                    <div>
                      <p className="font-bold tracking-tight">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.sub}</p>
                    </div>
                    <span className={`grid size-6 place-items-center rounded-full ${freq === f.id ? "bg-accent text-accent-foreground" : "border border-border"}`}>
                      {freq === f.id && <Check className="size-4" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <button
              onClick={() => freq && setStep(2)}
              disabled={!freq}
              className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-bold uppercase tracking-wider text-background disabled:opacity-30 active:scale-[0.99] transition-transform"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-10"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Step 2 of 2</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">
              What do you usually pay?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Best guess is fine — skip anything you're not sure about. Pre-filled with US national averages.
            </p>

            <ul className="mt-6 space-y-2 rounded-2xl border border-border bg-surface p-3">
              {STAPLES.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-1 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold tracking-tight">{s.name}</p>
                    <p className="font-mono text-[10px] uppercase text-muted-foreground">{s.unit}</p>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-2.5 grid place-items-center text-sm text-muted-foreground">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={prices[s.id] ?? ""}
                      placeholder={s.avgPrice.toFixed(2)}
                      onChange={(e) => setPrices((p) => ({ ...p, [s.id]: e.target.value.replace(/[^0-9.]/g, "") }))}
                      enterKeyHint="done"
                      className="h-10 w-24 rounded-lg border border-border bg-background pl-6 pr-2 text-right font-mono text-sm tab-nums focus:border-accent focus:outline-none"
                    />
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={fillAverages}
              className="mt-3 w-full rounded-full border border-border py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Use national averages for anything I skipped
            </button>

            <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-[11px] text-muted-foreground">
              Saved as <span className="font-mono">estimated baseline</span> dated 90 days ago. You'll see clear labels until real scans replace these.
            </p>

            <button
              onClick={saveBaseline}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/30 active:scale-[0.99] transition-transform"
            >
              See my dashboard <ArrowRight className="size-4" />
            </button>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-12 text-center"
          >
            <Bell className="mx-auto size-12 text-accent" />
            <h1 className="mt-6 text-2xl font-extrabold tracking-tight">
              Get alerted when prices cross your limits.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Push alerts are a paid feature. Preview the kind you'd get:
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-surface p-4 text-left">
              <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Wallet alert</p>
              <p className="mt-1 text-sm font-bold tracking-tight">
                You've paid {fmtUSD(37)} more for eggs this year than when you started tracking.
              </p>
            </div>
            <div className="mt-8 space-y-2">
              <button
                onClick={() => {
                  setNotifications(true);
                  navigate({ to: "/" });
                }}
                className="flex h-14 w-full items-center justify-center rounded-full bg-foreground text-sm font-bold uppercase tracking-wider text-background"
              >
                Allow notifications
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="h-12 w-full rounded-full text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                Not now
              </button>
            </div>
          </motion.section>
        )}
      </div>
    </AppShell>
  );
}
