import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { ArrowLeft, Share2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { HallOfShameCard } from "../components/ShareCard";
import { useApp } from "../lib/store";
import { aggregateItems, inflationScore } from "../lib/inflation";

export const Route = createFileRoute("/share/hall-of-shame")({
  head: () => ({ meta: [{ title: "Hall of Shame — ReceiptRage" }] }),
  component: HallOfShame,
});

function HallOfShame() {
  const navigate = useNavigate();
  const scans = useApp((s) => s.scans);
  const subscribed = useApp((s) => s.subscribed);

  const stats = useMemo(() => aggregateItems(scans), [scans]);
  const top = useMemo(() => [...stats].sort((a, b) => b.pctChange - a.pctChange).filter((s) => s.pctChange > 0), [stats]);
  const inflation = useMemo(() => inflationScore(stats), [stats]);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const share = async () => {
    // Web Share API where available; otherwise no-op (in a real native app this is RNView shot + Share)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Grocery Hall of Shame",
          text: `My personal grocery inflation: ${inflation.toFixed(1)}%. The worst offender? ${top[0]?.name ?? "—"}.`,
        });
      } catch { /* user cancelled */ }
    }
  };

  if (!subscribed) {
    return (
      <AppShell hideTabs>
        <div className="px-6 py-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">Paid feature</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Share cards are locked.</h1>
          <Link to="/" className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-bold uppercase tracking-wider text-background">
            Back
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideTabs>
      <div className="px-6 pt-4 pb-12">
        <button
          onClick={() => navigate({ to: "/" })}
          className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back
        </button>

        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight">Your share card</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Long-press to save the image, or tap Share.
        </p>

        <div ref={cardRef} className="mt-6 flex justify-center">
          <HallOfShameCard items={top} inflation={inflation} monthLabel={monthLabel} />
        </div>

        <button
          onClick={share}
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/30 active:scale-[0.99] transition-transform"
        >
          <Share2 className="size-4" /> Share
        </button>
      </div>
    </AppShell>
  );
}
