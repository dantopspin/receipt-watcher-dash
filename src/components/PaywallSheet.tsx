import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Lock, Sparkles } from "lucide-react";
import { useApp } from "../lib/store";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Reason headline shown above the value prop */
  reason?: string;
};

export function PaywallSheet({ open, onClose, reason }: Props) {
  const setSubscribed = useApp((s) => s.setSubscribed);

  const subscribe = (_plan: "monthly" | "annual") => {
    // Simulated RevenueCat purchase. In a native app this is
    // Purchases.purchasePackage() + entitlement check.
    setSubscribed(true);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[440px] overflow-hidden rounded-t-[28px] border-t border-border bg-background pb-[max(env(safe-area-inset-bottom),1rem)]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6 pt-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Upgrade
              </span>
              <button
                onClick={onClose}
                aria-label="Close"
                className="-mr-2 grid size-10 place-items-center rounded-full text-muted-foreground active:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-6 pt-2">
              {reason && (
                <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
                  {reason}
                </p>
              )}
              <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight">
                Your groceries are getting more expensive.
                <br />
                <span className="text-accent">Know exactly how much.</span>
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 px-6">
              <PlanCard
                title="Monthly"
                price="$3.99"
                cadence="/ month"
                onClick={() => subscribe("monthly")}
              />
              <PlanCard
                title="Annual"
                price="$29.99"
                cadence="/ year"
                badge="Save 37%"
                primary
                onClick={() => subscribe("annual")}
              />
            </div>

            <ul className="mt-6 space-y-2.5 border-t border-border px-6 pt-5 text-sm">
              {[
                "Unlimited receipt scans",
                "Shareable Hall of Shame & spike cards",
                "Push alerts when prices cross your limits",
                "Full Spending Trends & category breakdowns",
                "Export your data as CSV",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.5} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between border-t border-border px-6 py-4 text-[11px] text-muted-foreground">
              <button
                onClick={() => {
                  // Simulated restore — flip entitlement if a "purchase" was simulated previously.
                  setSubscribed(true);
                  onClose();
                }}
                className="font-medium underline-offset-2 hover:underline"
              >
                Restore purchases
              </button>
              <a href="/legal/privacy" className="font-medium underline-offset-2 hover:underline">
                Privacy policy
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PlanCard({
  title, price, cadence, badge, primary, onClick,
}: {
  title: string; price: string; cadence: string;
  badge?: string; primary?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 text-left transition-transform active:scale-[0.98] ${
        primary
          ? "bg-foreground text-background ring-2 ring-foreground"
          : "border border-border bg-surface"
      }`}
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent-foreground">
          {badge}
        </span>
      )}
      <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">{title}</p>
      <p className="mt-3 text-2xl font-extrabold tracking-tight tab-nums">{price}</p>
      <p className="text-xs opacity-70">{cadence}</p>
      <div className={`mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-tight ${primary ? "text-accent-foreground" : "text-accent"}`}>
        {primary ? <Sparkles className="size-3.5" /> : <Lock className="size-3.5" />}
        {primary ? "Most Popular" : "Continue"}
      </div>
    </button>
  );
}
