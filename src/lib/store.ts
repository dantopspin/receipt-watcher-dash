import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ItemSource = "scan" | "baseline_estimate";

export type ScanItem = {
  itemKey: string;     // canonical key
  name: string;        // canonical display name
  rawName: string;     // OCR raw
  price: number;
};

export type Scan = {
  id: string;
  date: string;        // ISO
  store: string;
  items: ScanItem[];
  source: ItemSource;
};

export type Frequency = "multi-week" | "weekly" | "biweekly" | "monthly";

type State = {
  hydrated: boolean;
  hasOnboarded: boolean;
  frequency: Frequency | null;
  scans: Scan[];
  subscribed: boolean;
  notificationsEnabled: boolean;
  firstLaunchAt: string;
};

type Actions = {
  setHydrated: () => void;
  completeOnboarding: (frequency: Frequency, baselines: Scan) => void;
  addScan: (s: Scan) => void;
  deleteScan: (id: string) => void;
  setFrequency: (f: Frequency) => void;
  setSubscribed: (v: boolean) => void;
  setNotifications: (v: boolean) => void;
  clearAll: () => void;
};

const initial: State = {
  hydrated: false,
  hasOnboarded: false,
  frequency: null,
  scans: [],
  subscribed: false,
  notificationsEnabled: false,
  firstLaunchAt: new Date().toISOString(),
};

export const useApp = create<State & Actions>()(
  persist(
    (set) => ({
      ...initial,
      setHydrated: () => set({ hydrated: true }),
      completeOnboarding: (frequency, baselines) =>
        set((s) => ({
          hasOnboarded: true,
          frequency,
          scans: [...s.scans, baselines],
        })),
      addScan: (scan) => set((s) => ({ scans: [...s.scans, scan] })),
      deleteScan: (id) => set((s) => ({ scans: s.scans.filter((x) => x.id !== id) })),
      setFrequency: (f) => set({ frequency: f }),
      setSubscribed: (v) => set({ subscribed: v }),
      setNotifications: (v) => set({ notificationsEnabled: v }),
      clearAll: () => set({ ...initial, hydrated: true, firstLaunchAt: new Date().toISOString() }),
    }),
    {
      name: "receiptrage:v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as never))),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
      skipHydration: typeof window === "undefined",
    },
  ),
);

// Helpers
export const realScans = (scans: Scan[]) => scans.filter((s) => s.source === "scan");
export const realScanCount = (scans: Scan[]) => realScans(scans).length;

// Free tier: up to 10 real scans; hard paywall on scan 4 in spec — we honor scan 4.
export const FREE_SOFT_PROMPT_AT = 2;
export const FREE_HARD_GATE_AT = 4;
