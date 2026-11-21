import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Download, ReceiptText, X } from "lucide-react";
import { Alert, Button, Card, EmptyState, Input, PageHeader, Select, Skeleton } from "../components/ui";
import TransactionList from "../components/TransactionList";
import { txTitle } from "../lib/transactions";
import { accountAPI, transactionAPI } from "../lib/api";
import { CATEGORIES, accountName, categoryLabel } from "../lib/constants";
import { isoDay, maskAccount, money } from "../lib/format";
import { useAsync } from "../lib/useAsync";

const EMPTY = { q: "", account: "", direction: "", category: "", from: "", to: "" };

/** Builds a CSV of exactly what's on screen (all accounts, current filters). */
function downloadCsv(rows) {
  const esc = (v) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = `'${s}`; // keep spreadsheets from running it as a formula
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = ["Date", "Reference", "Description", "Category", "Direction", "From", "To", "Amount"];
  const lines = rows.map((t) =>
    [
      t.transactionDate.replace("T", " ").slice(0, 16),
      t.transactionId,
      txTitle(t),
      categoryLabel(t.category),
      t.direction,
      t.fromAccountNumber || "Cash",
      t.toAccountNumber || "Cash",
      (t.direction === "DEBIT" ? "-" : "") + Number(t.amount).toFixed(2),
    ]
      .map(esc)
      .join(",")
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ledgerly-activity-${isoDay()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Activity() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState({ ...EMPTY, account: params.get("account") || "" });
  const [q, setQ] = useState(""); // typed search, applied after a short pause

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q })), 300);
    return () => clearTimeout(t);
  }, [q]);

  const accounts = useAsync(() => accountAPI.list(), []);
  const { data: txns, loading, error } = useAsync(() => transactionAPI.mine(filters), [JSON.stringify(filters)]);

  const set = (k) => (e) => {
    const v = e.target.value;
    setFilters((f) => ({ ...f, [k]: v }));
    if (k === "account") setParams(v ? { account: v } : {}, { replace: true });
  };
  const active = Object.entries(filters).some(([k, v]) => v && k !== "q") || q;

  const totals = (txns || []).reduce(
    (acc, t) => {
      if (t.direction === "CREDIT") acc.in += Number(t.amount);
      if (t.direction === "DEBIT") acc.out += Number(t.amount);
      return acc;
    },
    { in: 0, out: 0 }
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="Activity"
        description="Every transaction across your accounts."
        actions={
          <Button variant="secondary" icon={Download} onClick={() => downloadCsv(txns || [])} disabled={!txns?.length}>
            Export CSV
          </Button>
        }
      />

      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <Input className="pl-9" placeholder="Search name, note, reference" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          </div>
          <Select value={filters.account} onChange={set("account")} aria-label="Account">
            <option value="">All accounts</option>
            {accounts.data?.map((a) => (
              <option key={a.accountNumber} value={a.accountNumber}>
                {accountName(a)} {maskAccount(a.accountNumber)}
              </option>
            ))}
          </Select>
          <Select value={filters.direction} onChange={set("direction")} aria-label="Direction">
            <option value="">In &amp; out</option>
            <option value="CREDIT">Money in</option>
            <option value="DEBIT">Money out</option>
            <option value="INTERNAL">Between my accounts</option>
          </Select>
          <Select value={filters.category} onChange={set("category")} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3">
            <Input type="date" value={filters.from} max={filters.to || isoDay()} onChange={set("from")} aria-label="From date" />
            <span className="shrink-0 text-sm text-faint">to</span>
            <Input type="date" value={filters.to} min={filters.from} max={isoDay()} onChange={set("to")} aria-label="To date" />
          </div>
        </div>
        {active && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
            <p className="tabular text-muted">
              {txns?.length ?? 0} result{txns?.length === 1 ? "" : "s"} · In <span className="text-ink">{money(totals.in)}</span> · Out{" "}
              <span className="text-ink">{money(totals.out)}</span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={() => {
                setQ("");
                setFilters(EMPTY);
                setParams({}, { replace: true });
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      {error && <Alert className="mb-6">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading && !txns ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : txns?.length ? (
          <TransactionList items={txns} />
        ) : (
          <EmptyState
            icon={ReceiptText}
            title={active ? "Nothing matches these filters" : "No activity yet"}
            description={active ? "Try a wider date range or clear the filters." : "Your transactions will appear here."}
          />
        )}
      </Card>
    </div>
  );
}
