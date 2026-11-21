import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Banknote } from "lucide-react";
import { categoryLabel } from "../lib/constants";
import { cx, dayLabel, money, time } from "../lib/format";
import { txTitle } from "../lib/transactions";

function txIcon(t) {
  if (t.transactionType === "DEPOSIT" || t.transactionType === "WITHDRAWAL") return Banknote;
  if (t.direction === "INTERNAL") return ArrowLeftRight;
  return t.direction === "CREDIT" ? ArrowDownLeft : ArrowUpRight;
}

export function Amount({ t, className }) {
  const credit = t.direction === "CREDIT";
  const internal = t.direction === "INTERNAL";
  return (
    <span className={cx("tabular whitespace-nowrap font-medium", credit ? "text-accent-ink" : "text-ink", className)}>
      {internal ? "" : credit ? "+" : "−"}
      {money(t.amount)}
    </span>
  );
}

export function TransactionRow({ t, showBalance }) {
  const Icon = txIcon(t);
  const credit = t.direction === "CREDIT";
  const subtitle = [
    t.transactionType === "TRANSFER" && t.description,
    categoryLabel(t.category),
    time(t.transactionDate),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center gap-3.5 px-5 py-3.5 sm:px-6">
      <span
        className={cx(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          credit ? "bg-accent-soft text-accent-ink" : "bg-subtle text-muted"
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{txTitle(t)}</p>
        <p className="truncate text-xs text-faint">{subtitle}</p>
      </div>
      <div className="text-right">
        <Amount t={t} className="text-sm" />
        {showBalance && t.balanceAfter != null && (
          <p className="tabular text-xs text-faint">Bal {money(t.balanceAfter)}</p>
        )}
      </div>
    </li>
  );
}

/** Transactions grouped under "Today", "Yesterday", "18 Nov 2026" headings. */
export default function TransactionList({ items, showBalance = false, grouped = true }) {
  if (!grouped) {
    return (
      <ul className="divide-y divide-line">
        {items.map((t) => (
          <TransactionRow key={t.transactionId} t={t} showBalance={showBalance} />
        ))}
      </ul>
    );
  }
  const groups = [];
  for (const t of items) {
    const label = dayLabel(t.transactionDate);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(t);
    else groups.push({ label, items: [t] });
  }
  return (
    <div>
      {groups.map((g) => (
        <section key={g.label}>
          <h3 className="border-y border-line bg-subtle/60 px-5 py-1.5 text-xs font-medium text-muted first:border-t-0 sm:px-6">
            {g.label}
          </h3>
          <ul className="divide-y divide-line">
            {g.items.map((t) => (
              <TransactionRow key={t.transactionId} t={t} showBalance={showBalance} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
