import { Link } from "react-router-dom";
import { Send, ArrowDownToLine, ArrowUpFromLine, Plus, Wallet, ReceiptText, ArrowRight } from "lucide-react";
import { Alert, Button, Card, CardHeader, EmptyState, Skeleton } from "../components/ui";
import AccountCard from "../components/AccountCard";
import TransactionList from "../components/TransactionList";
import { useAuth } from "../context/AuthContext";
import { accountAPI, insightsAPI, transactionAPI } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { greeting, money } from "../lib/format";

const QUICK = [
  { to: "/move?tab=transfer", label: "Send", icon: Send },
  { to: "/move?tab=deposit", label: "Deposit", icon: ArrowDownToLine },
  { to: "/move?tab=withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { to: "/accounts?new=1", label: "New account", icon: Plus },
];

export default function Overview() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(
    () => Promise.all([accountAPI.list(), insightsAPI.get(), transactionAPI.mine()]),
    []
  );
  const [accounts, insights, txns] = data || [];
  const open = accounts?.filter((a) => a.active) || [];
  const firstName = user?.fullName?.split(" ")[0];

  return (
    <div className="fade-in space-y-8">
      <div>
        <p className="text-sm text-muted">{greeting()},</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{firstName}</h1>
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Balance + this month */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-muted">Total balance</p>
            {loading ? (
              <Skeleton className="mt-2 h-10 w-56" />
            ) : (
              <p className="tabular mt-1 text-4xl font-semibold tracking-tight text-ink">{money(insights?.totalBalance)}</p>
            )}
            <p className="mt-2 text-sm text-faint">
              across {open.length} open account{open.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 min-[360px]:gap-6 sm:gap-12">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <span className="size-2 rounded-sm bg-series-in" aria-hidden /> In this month
              </p>
              {loading ? <Skeleton className="mt-1.5 h-6 w-24" /> : <p className="tabular mt-1 text-lg font-semibold text-ink">{money(insights?.moneyInThisMonth)}</p>}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <span className="size-2 rounded-sm bg-series-out" aria-hidden /> Out this month
              </p>
              {loading ? <Skeleton className="mt-1.5 h-6 w-24" /> : <p className="tabular mt-1 text-lg font-semibold text-ink">{money(insights?.moneyOutThisMonth)}</p>}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 border-t border-line pt-6 sm:grid-cols-4">
          {QUICK.map(({ to, label, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-subtle"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                <Icon className="size-4" aria-hidden />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </Card>

      {/* Accounts */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Accounts</h2>
          <Link to="/accounts" className="text-sm font-medium text-muted hover:text-ink">
            Manage
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[124px] rounded-2xl" />
            ))}
          </div>
        ) : open.length === 0 ? (
          <Card>
            <EmptyState
              icon={Wallet}
              title="Open your first account"
              description="Savings, current or fixed deposit. Add an opening deposit if you like."
              action={<Button to="/accounts?new=1" icon={Plus}>Open an account</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((a) => (
              <AccountCard key={a.accountNumber} account={a} />
            ))}
          </div>
        )}
      </section>

      {/* Recent activity */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Recent activity"
          action={
            <Link to="/activity" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
          className="pb-4"
        />
        {loading ? (
          <div className="space-y-3 px-6 pb-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : txns?.length ? (
          <TransactionList items={txns.slice(0, 6)} />
        ) : (
          <EmptyState icon={ReceiptText} title="No activity yet" description="Deposits, transfers and withdrawals will show up here." />
        )}
      </Card>
    </div>
  );
}
