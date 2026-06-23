import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Download, Lock, RotateCcw, Trash2, ChevronRight } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { PaywallSheet } from "../components/PaywallSheet";
import { useApp, type Frequency } from "../lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — ReceiptRage" }] }),
  component: Settings,
});

const FREQ_LABELS: Record<Frequency, string> = {
  "multi-week": "Multiple times per week",
  "weekly": "Once a week",
  "biweekly": "Every two weeks",
  "monthly": "Once a month",
};

function Settings() {
  const navigate = useNavigate();
  const frequency = useApp((s) => s.frequency);
  const setFrequency = useApp((s) => s.setFrequency);
  const notifications = useApp((s) => s.notificationsEnabled);
  const setNotifications = useApp((s) => s.setNotifications);
  const subscribed = useApp((s) => s.subscribed);
  const setSubscribed = useApp((s) => s.setSubscribed);
  const scans = useApp((s) => s.scans);
  const clearAll = useApp((s) => s.clearAll);

  const [paywall, setPaywall] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const exportCsv = () => {
    if (!subscribed) return setPaywall(true);
    const rows = [["date","store","item","price","source"]];
    for (const s of scans) for (const it of s.items)
      rows.push([s.date, s.store, it.name, String(it.price), s.source]);
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "receiptrage.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="px-6 pt-6 pb-8">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Settings</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Your setup</h1>

        <Section title={subscribed ? "Plan — Paid" : "Plan — Free"}>
          {subscribed ? (
            <Row label="Manage subscription" hint="Annual • Renews automatically" onClick={() => setSubscribed(false)} />
          ) : (
            <Row
              label="Upgrade to ReceiptRage Paid"
              hint="Unlimited scans, share cards, alerts, CSV export"
              onClick={() => setPaywall(true)}
              accent
            />
          )}
          <Row label="Restore purchases" onClick={() => setSubscribed(true)} icon={RotateCcw} />
        </Section>

        <Section title="Tracking">
          <Row
            label="Shopping frequency"
            hint={frequency ? FREQ_LABELS[frequency] : "Not set"}
            onClick={() => {
              const order: Frequency[] = ["multi-week", "weekly", "biweekly", "monthly"];
              const idx = frequency ? order.indexOf(frequency) : -1;
              setFrequency(order[(idx + 1) % order.length]);
            }}
          />
          <Toggle
            label="Push notifications"
            sub={subscribed ? "Wallet alerts, milestones, weekly digest" : "Paid feature"}
            checked={notifications && subscribed}
            disabled={!subscribed}
            onChange={(v) => (subscribed ? setNotifications(v) : setPaywall(true))}
            icon={subscribed ? Bell : Lock}
          />
        </Section>

        <Section title="Data">
          <Row
            label="Export as CSV"
            hint={subscribed ? `${scans.flatMap((s) => s.items).length} rows` : "Paid feature"}
            icon={subscribed ? Download : Lock}
            onClick={exportCsv}
          />
          {confirmClear ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-bold text-destructive">Erase all receipts and history?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                This permanently deletes all locally stored data. No backups exist.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { clearAll(); navigate({ to: "/" }); }}
                  className="flex-1 rounded-full bg-destructive py-2.5 text-xs font-bold uppercase tracking-wider text-destructive-foreground"
                >
                  Erase everything
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 rounded-full border border-border py-2.5 text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <Row
              label="Clear all data"
              hint="Permanently erases everything on this device"
              icon={Trash2}
              onClick={() => setConfirmClear(true)}
              destructive
            />
          )}
        </Section>

        <Section title="About">
          <LinkRow to="/legal/about" label="About ReceiptRage" />
          <LinkRow to="/legal/privacy" label="Privacy Policy" />
          <LinkRow to="/legal/terms" label="Terms of Service" />
        </Section>

        <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          ReceiptRage v1.0 · All data lives on this device
        </p>
      </div>

      <PaywallSheet open={paywall} onClose={() => setPaywall(false)} reason="Paid feature" />
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <p className="px-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function Row({
  label, hint, onClick, icon: Icon, accent, destructive,
}: {
  label: string; hint?: string; onClick?: () => void;
  icon?: typeof Bell; accent?: boolean; destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left active:bg-muted transition-colors ${
        destructive ? "border-destructive/20" : ""
      }`}
    >
      {Icon && <Icon className={`size-5 shrink-0 ${destructive ? "text-destructive" : accent ? "text-accent" : "text-muted-foreground"}`} />}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold tracking-tight ${destructive ? "text-destructive" : accent ? "text-accent" : ""}`}>{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <ChevronRight className="size-4 text-muted-foreground/60" />
    </button>
  );
}

function LinkRow({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 active:bg-muted transition-colors"
    >
      <p className="flex-1 text-sm font-bold tracking-tight">{label}</p>
      <ChevronRight className="size-4 text-muted-foreground/60" />
    </Link>
  );
}

function Toggle({
  label, sub, checked, onChange, disabled, icon: Icon,
}: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void;
  disabled?: boolean; icon?: typeof Bell;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
      {Icon && <Icon className={`size-5 shrink-0 ${disabled ? "text-muted-foreground" : "text-accent"}`} />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold tracking-tight">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-muted"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
