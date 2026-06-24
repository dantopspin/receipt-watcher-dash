import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, Trash2, X, Loader2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { PaywallSheet } from "../components/PaywallSheet";
import { useApp, realScanCount, FREE_HARD_GATE_AT, type Scan } from "../lib/store";
import { MOCK_RECEIPTS } from "../lib/seed";
import { normalize } from "../lib/normalize";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Scan a receipt — ReceiptRage" }] }),
  component: ScanPage,
});

type Stage = "camera" | "scanning" | "review" | "saved";

type Editable = {
  id: string;
  rawName: string;
  name: string;
  priceStr: string;
};

function ScanPage() {
  const navigate = useNavigate();
  const hydrated = useApp((s) => s.hydrated);
  const scans = useApp((s) => s.scans);
  const subscribed = useApp((s) => s.subscribed);
  const addScan = useApp((s) => s.addScan);
  const hasOnboarded = useApp((s) => s.hasOnboarded);

  const realCount = realScanCount(scans);

  const [stage, setStage] = useState<Stage>("camera");
  const [store, setStore] = useState("");
  const [items, setItems] = useState<Editable[]>([]);
  const [paywall, setPaywall] = useState(false);
  const [savedSummary, setSavedSummary] = useState<{ spikes: number; tracked: number } | null>(null);

  // Hard paywall on scan 4 (before save). Show paywall, allow dismiss/upgrade.
  const hardGate = !subscribed && realCount + 1 > FREE_HARD_GATE_AT;

  // Simulated camera capture
  const capture = async () => {
    setStage("scanning");
    await wait(900); // shutter / OCR feel
    const pick = MOCK_RECEIPTS[Math.floor(Math.random() * MOCK_RECEIPTS.length)];
    // Slight randomized price drift to simulate "this week" pricing
    const drift = () => 1 + (Math.random() * 0.16 + 0.04); // +4–20%
    setStore(pick.store);
    setItems(
      pick.lines.map((l) => ({
        id: cryptoRandom(),
        rawName: l.name,
        name: normalize(l.name).canonical,
        priceStr: (l.price * drift()).toFixed(2),
      })),
    );
    setStage("review");
  };

  useEffect(() => {
    if (!hydrated) return;
    if (stage === "review" && hardGate) setPaywall(true);
  }, [hydrated, stage, hardGate]);

  const save = () => {
    if (hardGate && !subscribed) {
      setPaywall(true);
      return;
    }
    const cleaned = items
      .map((i) => ({
        rawName: i.rawName,
        name: i.name.trim(),
        price: Number.parseFloat(i.priceStr),
        itemKey: normalize(i.name || i.rawName).key,
      }))
      .filter((i) => i.name && Number.isFinite(i.price) && i.price > 0);

    if (!cleaned.length) return;

    const scan: Scan = {
      id: cryptoRandom(),
      date: new Date().toISOString(),
      store: store.trim() || "Unknown store",
      items: cleaned,
      source: "scan",
    };

    // Compute summary BEFORE adding to compare against history
    const knownKeys = new Set(
      scans.flatMap((s) => s.items.map((it) => it.itemKey)),
    );
    const tracked = cleaned.filter((c) => knownKeys.has(c.itemKey)).length;
    // crude spike count: at least 1 prior entry for that key with lower price
    const priorPrice = new Map<string, number>();
    for (const s of scans)
      for (const it of s.items)
        priorPrice.set(it.itemKey, it.price); // last seen wins
    const spikes = cleaned.filter((c) => {
      const p = priorPrice.get(c.itemKey);
      return p && c.price > p * 1.05;
    }).length;

    addScan(scan);
    setSavedSummary({ spikes, tracked });
    setStage("saved");

    // Route into onboarding after the FIRST real scan completes.
    if (!hasOnboarded) {
      setTimeout(() => navigate({ to: "/onboarding" }), 1400);
    } else {
      setTimeout(() => navigate({ to: "/" }), 1600);
    }
  };

  return (
    <AppShell bare hideTabs>
      <div className="relative min-h-svh bg-foreground text-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
          <button
            onClick={() => navigate({ to: "/" })}
            aria-label="Cancel"
            className="grid size-10 place-items-center rounded-full bg-white/10 backdrop-blur"
          >
            <X className="size-5" />
          </button>
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
            {stage === "camera" && "Aim at receipt"}
            {stage === "scanning" && "Reading…"}
            {stage === "review" && "Confirm items"}
            {stage === "saved" && "Saved"}
          </span>
          <div className="size-10" />
        </div>

        <AnimatePresence mode="wait">
          {stage === "camera" && (
            <motion.section
              key="camera"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="px-5"
            >
              <div className="relative mt-2 aspect-[3/5] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black">
                {/* Receipt-shaped crop guide */}
                <div className="absolute inset-6 rounded-xl border border-white/15" />
                {/* Corner ticks */}
                {[
                  "left-5 top-5 border-l-2 border-t-2",
                  "right-5 top-5 border-r-2 border-t-2",
                  "left-5 bottom-5 border-l-2 border-b-2",
                  "right-5 bottom-5 border-r-2 border-b-2",
                ].map((c, i) => (
                  <span key={i} className={`absolute size-6 border-accent ${c}`} />
                ))}
                {/* Animated scan line */}
                <div className="absolute inset-x-12 top-12 h-px overflow-visible">
                  <div className="animate-scanline h-[2px] w-full bg-accent shadow-[0_0_24px_var(--color-accent)]" />
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">Demo mode</p>
                  <p className="mt-1 text-xs opacity-80">Tap capture to simulate</p>
                </div>
              </div>


              <button
                onClick={capture}
                className="mx-auto mt-8 grid size-20 place-items-center rounded-full bg-accent shadow-2xl shadow-accent/30 ring-4 ring-white/20 active:scale-95 transition-transform"
                aria-label="Capture"
              >
                <Camera className="size-8 text-accent-foreground" strokeWidth={2.25} />
              </button>
              <p className="mt-4 text-center text-xs opacity-60">
                Receipts stay on your device. Always.
              </p>
            </motion.section>
          )}

          {stage === "scanning" && (
            <motion.section
              key="scanning"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center px-10 py-24 text-center"
            >
              <Loader2 className="size-10 animate-spin text-accent" />
              <p className="mt-6 font-mono text-[11px] uppercase tracking-widest opacity-70">
                Reading line items
              </p>
              <p className="mt-2 text-lg font-bold">Extracting prices…</p>
            </motion.section>
          )}

          {stage === "review" && (
            <ReviewView
              store={store} setStore={setStore}
              items={items} setItems={setItems}
              onSave={save}
              gated={hardGate && !subscribed}
              onUpgrade={() => setPaywall(true)}
            />
          )}

          {stage === "saved" && (
            <motion.section
              key="saved"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center px-10 py-24 text-center"
            >
              <div className="grid size-20 place-items-center rounded-full bg-accent">
                <Check className="size-10 text-accent-foreground" strokeWidth={3} />
              </div>
              <p className="mt-6 font-mono text-[11px] uppercase tracking-widest opacity-70">
                Scan complete
              </p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight">
                {savedSummary && savedSummary.spikes > 0
                  ? `${savedSummary.spikes} ${savedSummary.spikes === 1 ? "item" : "items"} spiked this trip.`
                  : "Logged. No spikes this trip."}
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      <PaywallSheet
        open={paywall}
        onClose={() => setPaywall(false)}
        reason={`Free limit: ${FREE_HARD_GATE_AT} scans`}
      />
    </AppShell>
  );
}

function ReviewView({
  store, setStore, items, setItems, onSave, gated, onUpgrade,
}: {
  store: string; setStore: (s: string) => void;
  items: Editable[]; setItems: (u: (prev: Editable[]) => Editable[]) => void;
  onSave: () => void; gated: boolean; onUpgrade: () => void;
}) {
  const focusedRef = useRef<HTMLInputElement | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const deleteSelected = () => {
    setItems((prev) => prev.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
  };
  const swipeDelete = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <motion.section
      key="review"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="bg-background text-foreground rounded-t-3xl mt-2 min-h-[calc(100svh-4rem)] px-5 pt-6 pb-32"
    >
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Store
        </span>
        <input
          type="text"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          enterKeyHint="done"
          className="mt-1 w-full border-b border-border bg-transparent py-2 text-lg font-bold tracking-tight focus:border-accent focus:outline-none"
          placeholder="Where you shopped"
        />
      </label>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Line items ({items.length})
        </h3>
        {selected.size > 0 && (
          <button
            onClick={deleteSelected}
            className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-[11px] font-bold text-destructive-foreground"
          >
            <Trash2 className="size-3.5" /> Delete {selected.size}
          </button>
        )}
      </div>

      <ul className="mt-3 divide-y divide-border">
        {items.map((it) => (
          <SwipeRow key={it.id} onDelete={() => swipeDelete(it.id)}>
            <div className="flex items-start gap-3 py-3">
              <button
                onClick={() => toggle(it.id)}
                aria-label="Select"
                className={`mt-1.5 grid size-5 shrink-0 place-items-center rounded-md border ${
                  selected.has(it.id) ? "border-accent bg-accent text-accent-foreground" : "border-border"
                }`}
              >
                {selected.has(it.id) && <Check className="size-3.5" strokeWidth={3} />}
              </button>
              <div className="grid flex-1 grid-cols-[1fr_88px] gap-3">
                <input
                  type="text"
                  value={it.name}
                  onChange={(e) =>
                    setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, name: e.target.value } : p)))
                  }
                  enterKeyHint="done"
                  className="w-full rounded-md bg-transparent py-1.5 text-sm font-semibold tracking-tight focus:bg-muted focus:px-2 focus:outline-none"
                  placeholder="Item name"
                />
                <input
                  ref={focusedRef}
                  type="text"
                  inputMode="decimal"
                  value={it.priceStr}
                  onChange={(e) =>
                    setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, priceStr: e.target.value.replace(/[^0-9.]/g, "") } : p)))
                  }
                  enterKeyHint="done"
                  className="w-full rounded-md bg-muted py-1.5 text-right font-mono text-sm tab-nums focus:outline focus:outline-2 focus:outline-accent"
                />
              </div>
            </div>
            <p className="pl-8 text-[10px] font-mono uppercase text-muted-foreground/70">
              OCR: {it.rawName}
            </p>
          </SwipeRow>
        ))}
      </ul>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[440px] border-t border-border bg-background/95 px-5 py-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur">
        {gated ? (
          <button
            onClick={onUpgrade}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground text-sm font-bold uppercase tracking-wider text-background"
          >
            Upgrade to save scan
          </button>
        ) : (
          <button
            onClick={onSave}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-bold uppercase tracking-wider text-accent-foreground shadow-lg shadow-accent/30 active:scale-[0.99] transition-transform"
          >
            Save & compare
          </button>
        )}
      </div>
    </motion.section>
  );
}

function SwipeRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [dragX, setDragX] = useState(0);
  return (
    <li className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-destructive-foreground">
        <span className="rounded-full bg-destructive px-3 py-1 text-[11px] font-bold uppercase">Delete</span>
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.2}
        animate={{ x: dragX }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -90) {
            onDelete();
          } else {
            setDragX(0);
          }
        }}
        className="bg-background"
      >
        {children}
      </motion.div>
    </li>
  );
}

function wait(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function cryptoRandom() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
