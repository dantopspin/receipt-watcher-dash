import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "../components/AppShell";

export const Route = createFileRoute("/legal/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${cap(params.slug)} — ReceiptRage` }] }),
  component: Legal,
});

const PAGES: Record<string, { title: string; body: { h?: string; p?: string }[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      { p: "ReceiptRage is built to be radically private. Every receipt you scan, every price you record, and every preference you set is stored only on this device." },
      { h: "What we collect" },
      { p: "Nothing. ReceiptRage has no account system, no analytics service, and no server that receives your data. Receipt images are processed locally for line-item extraction and are not transmitted." },
      { h: "On-device storage" },
      { p: "Your scans, baseline estimates, shopping frequency, and notification preferences live in your phone's local storage. Clearing the app's data — either from Settings → Clear all data, or by uninstalling — permanently removes them." },
      { h: "Subscriptions" },
      { p: "Purchase verification is handled by the platform (Apple) and a third-party receipt manager (RevenueCat) so that subscriptions persist across devices and reinstalls. Only an anonymous app-installation identifier is sent. We never see your name, email, payment details, or receipts." },
      { h: "Children" },
      { p: "ReceiptRage is not directed at children under 13 and we do not knowingly collect any data from them." },
      { h: "Contact" },
      { p: "Questions about this policy? Email privacy@receiptrage.app." },
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      { p: "By using ReceiptRage you agree to these terms." },
      { h: "Use of the app" },
      { p: "ReceiptRage is provided as a personal informational tool. The price comparisons, inflation scores, and projections in the app are estimates based on the data you enter and are not financial advice." },
      { h: "Accuracy" },
      { p: "We try hard to extract line items accurately, but OCR is imperfect. You are responsible for confirming each scanned item before saving." },
      { h: "Subscriptions" },
      { p: "Paid plans renew automatically at the end of each billing period unless cancelled at least 24 hours before renewal in your App Store settings. Prices are shown at checkout in your local currency." },
      { h: "Termination" },
      { p: "You may stop using ReceiptRage at any time. Cancellation in the App Store stops future renewals; the current period continues until expiry." },
      { h: "Liability" },
      { p: "To the maximum extent allowed by law, ReceiptRage is provided as-is without warranty of any kind." },
    ],
  },
  about: {
    title: "About ReceiptRage",
    body: [
      { p: "ReceiptRage is an independent app built for everyday people who are watching their grocery bill creep up and want receipts — literal receipts — that prove it." },
      { h: "Why it exists" },
      { p: "National inflation numbers don't feel real. Your eggs, your milk, your weekly cart? Those feel real. ReceiptRage tracks the prices you actually pay and shows you exactly how much they've moved." },
      { h: "How it works" },
      { p: "Scan a receipt. We extract line items and prices. Confirm. Repeat. Each new scan is compared to your own history — and we surface the spikes, the dollar damage, and the items quietly draining your wallet." },
      { h: "What it isn't" },
      { p: "It's not a budgeting app, not a coupon app, and not a finance tool. It is a receipt-bound record of what your groceries actually cost, kept entirely on your phone." },
    ],
  },
};

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function Legal() {
  const { slug } = Route.useParams();
  const page = PAGES[slug];
  if (!page) {
    return (
      <AppShell hideTabs>
        <div className="px-6 py-12">
          <Link to="/settings" className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">← Settings</Link>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Page not found</h1>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell hideTabs>
      <div className="px-6 pt-4 pb-12">
        <Link to="/settings" className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <ArrowLeft className="size-3.5" /> Settings
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight">{page.title}</h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Last updated June 2026
        </p>
        <article className="prose mt-8 space-y-5 text-[15px] leading-relaxed">
          {page.body.map((b, i) =>
            b.h ? (
              <h2 key={i} className="text-base font-extrabold tracking-tight text-foreground">{b.h}</h2>
            ) : (
              <p key={i} className="text-muted-foreground">{b.p}</p>
            ),
          )}
        </article>
      </div>
    </AppShell>
  );
}
