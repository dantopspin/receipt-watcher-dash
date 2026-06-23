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
              <span className="size-2 rounded-full bg-accent" aria-hidden />
              <span className="font-mono text-[11px] font-medium uppercase tracking-tighter">
                ReceiptRage
              </span>
            </Link>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Personal Index
            </div>
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
            className="group -mt-10 flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl shadow-accent/30 ring-4 ring-background active:scale-95 transition-transform"
            aria-label="Scan receipt"
          >
            <Camera className="size-7" strokeWidth={2.25} />
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
