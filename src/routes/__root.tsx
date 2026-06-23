import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useApp } from "../lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Error 404</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That receipt didn't make it to the file.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-bold text-background"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">Something broke</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again, or head back to the dashboard.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="h-11 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground"
          >
            Try again
          </button>
          <a href="/" className="h-11 inline-flex items-center rounded-full border border-border px-5 text-sm font-bold">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#fafaf7" },
      { title: "ReceiptRage — Know exactly how much more you're paying" },
      { name: "description", content: "Scan any grocery receipt and instantly see which items have spiked in price compared to your own history. Personal inflation, in real dollars." },
      { property: "og:title", content: "ReceiptRage" },
      { property: "og:description", content: "Your personal grocery inflation tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const setHydrated = useApp((s) => s.setHydrated);

  useEffect(() => {
    // Trigger zustand persist rehydration explicitly on client
    void useApp.persist.rehydrate();
    setHydrated();

    // Dismiss keyboard on outside taps
    const onPointer = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const inField = t.closest("input, textarea, select, [contenteditable]");
      if (!inField && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [setHydrated]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
