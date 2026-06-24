import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BarChart3, Settings as SettingsIcon, Camera } from "lucide-react";
import { type ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
  children: ReactNode;
  hideTabs?: boolean;
  /** Hide the sticky brand header (e.g. on full-screen scan view). */
  bare?: boolean;
};

export function AppShell({ children, hideTabs, bare }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-[440px] flex-col bg-background">
        {!bare && (
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-6 pb-3 pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-xl">
            <Link to="/" className="flex items-center gap-2">
              <span className="relative grid size-5 place-items-center rounded-[6px] bg-foreground text-background">
                <span className="font-mono text-[9px] font-black leading-none">R</span>
                <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-accent ring-2 ring-background" />
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
                ReceiptRage
              </span>
            </Link>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Evidence Log
            </span>
          </header>
        )}


        <motion.main
          key={pathname}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`flex-1 ${hideTabs ? "pb-6" : "pb-28"}`}
        >
          {children}
        </motion.main>

        {!hideTabs && <TabBar pathname={pathname} />}
      </div>
    </div>
  );
}

function TabBar({ pathname }: { pathname: string }) {
  const tabs = [
    { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    { to: "/trends", label: "Trends", icon: BarChart3, match: (p: string) => p.startsWith("/trends") },
    { to: "/settings", label: "Settings", icon: SettingsIcon, match: (p: string) => p.startsWith("/settings") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[440px]">
      <div className="relative border-t border-border bg-background/90 px-6 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          {tabs.slice(0, 1).map((t) => (
            <TabItem key={t.to} {...t} active={t.match(pathname)} />
          ))}

          <Link
            to="/scan"
            className="group relative -mt-10 flex size-16 items-center justify-center rounded-full bg-foreground text-background shadow-xl shadow-foreground/25 ring-4 ring-background active:scale-95 transition-transform"
            aria-label="Scan receipt"
          >
            <span className="absolute -inset-1 -z-10 rounded-full bg-accent/35 blur-md" />
            <Camera className="size-7" strokeWidth={2.25} />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-accent ring-2 ring-background" />
          </Link>


          {tabs.slice(1).map((t) => (
            <TabItem key={t.to} {...t} active={t.match(pathname)} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function TabItem({
  to, label, icon: Icon, active,
}: { to: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex w-16 flex-col items-center gap-1 transition-opacity ${active ? "opacity-100" : "opacity-50"}`}
    >
      <Icon className={`size-5 ${active ? "text-accent" : ""}`} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-[10px] font-bold uppercase tracking-tighter ${active ? "text-accent" : ""}`}>
        {label}
      </span>
    </Link>
  );
}
