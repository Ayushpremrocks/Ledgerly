import { Link } from "react-router-dom";
import { ArrowLeftRight, BarChart3, ShieldCheck, FileText, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Logo from "../components/Logo";

const FEATURES = [
  { icon: ArrowLeftRight, title: "Move money instantly", text: "Pay saved payees or any account number, with a check before you send." },
  { icon: BarChart3, title: "See where it goes", text: "Monthly money in and out, spending by category, your top payees." },
  { icon: FileText, title: "Statements on demand", text: "Running balances and CSV statements for any date range." },
  { icon: ShieldCheck, title: "Safe by default", text: "Daily limits, sign-in protection and alerts on every payment." },
];

// Sample rows for the preview card on the left. Purely decorative.
const PREVIEW = [
  { name: "Salary", note: "Acme Corp", amount: "+₹85,000.00", inbound: true },
  { name: "Rent", note: "To Landlord", amount: "−₹22,000.00", inbound: false },
  { name: "Groceries", note: "Food", amount: "−₹3,240.00", inbound: false },
];

/** About Ledgerly: the left half of the sign-in and sign-up screens (large screens only). */
function AboutPanel() {
  return (
    <aside className="relative hidden border-r border-line bg-accent-soft lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-1/2 lg:flex-col lg:justify-between lg:overflow-y-auto lg:p-10 xl:px-16 tall-lt-820:lg:py-7">
      {/* Content steps down as the screen gets shorter so it always fits without cutting off:
          <=940px tall hides feature blurbs, <=820px the sample transactions, <=680px shrinks the headline. */}
      <Link to="/" aria-label="Ledgerly home" className="self-start">
        <Logo />
      </Link>

      <div className="mx-auto w-full max-w-md py-8 tall-lt-820:py-5 min-[1800px]:max-w-lg">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink xl:text-4xl tall-lt-680:text-2xl">
          Banking that stays out of your way.
        </h2>
        <p className="mt-3 text-base text-muted">
          Open accounts, move money and understand your spending, all in one calm place.
        </p>

        <div aria-hidden="true" className="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-black/5 tall-lt-820:mt-6">
          <p className="text-xs font-medium text-faint">Total balance</p>
          <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-ink">₹2,47,640.00</p>
          <ul className="mt-4 divide-y divide-line border-t border-line tall-lt-820:hidden">
            {PREVIEW.map((row) => (
              <li key={row.name} className="flex items-center gap-3 py-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-subtle">
                  {row.inbound ? (
                    <ArrowDownLeft className="size-4 text-accent-ink" />
                  ) : (
                    <ArrowUpRight className="size-4 text-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{row.name}</span>
                  <span className="block text-xs text-faint">{row.note}</span>
                </span>
                <span className={`tabular text-sm font-medium ${row.inbound ? "text-accent-ink" : "text-ink"}`}>{row.amount}</span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 tall-lt-820:mt-6 tall-lt-680:gap-y-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon className="size-5 text-accent-ink" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-muted tall-lt-940:hidden">{text}</p>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-faint">Ledgerly is a demo bank. No real money moves.</p>
    </aside>
  );
}

/** Shared frame for sign-in and sign-up: about Ledgerly on the left, the form on the right. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <AboutPanel />

      <div className="flex min-h-dvh flex-1 flex-col px-4">
        {/* On small screens the about panel is hidden, so the logo lives here */}
        <header className="flex items-center py-6 lg:hidden">
          <Link to="/" aria-label="Ledgerly home">
            <Logo />
          </Link>
        </header>
        <main className="flex flex-1 items-start justify-center py-6 sm:items-center sm:py-10">
          <div className="fade-in w-full max-w-[400px] min-[1800px]:max-w-[440px]">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
            {footer && <p className="mt-8 text-center text-sm text-muted">{footer}</p>}

            {/* Phones and tablets: a compact version of the about panel, under the form */}
            <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line pt-8 lg:hidden" aria-label="Why Ledgerly">
              {FEATURES.map(({ icon: Icon, title: name }) => (
                <li key={name} className="flex items-start gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft">
                    <Icon className="size-4 text-accent-ink" aria-hidden="true" />
                  </span>
                  <span className="pt-1.5 text-[13px] font-medium leading-snug text-ink">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </main>
        <footer className="pb-6 text-center text-xs text-faint lg:hidden">
          Ledgerly is a demo bank. No real money moves.
        </footer>
      </div>
    </div>
  );
}
