import { useMemo, useState } from "react";
import { Search, Snowflake, ShieldCheck, Lock } from "lucide-react";
import { Alert, Badge, Button, Card, Input, PageHeader, Segmented, Skeleton, Stat } from "../components/ui";
import BarChart from "../components/charts/BarChart";
import { useToast } from "../context/ToastContext";
import { adminAPI, errorMessage } from "../lib/api";
import { accountName, accountTypeLabel } from "../lib/constants";
import { date, dateTime, money, moneyCompact } from "../lib/format";
import { useAsync } from "../lib/useAsync";

const VOLUME = [{ key: "volume", label: "Volume", color: "var(--accent)" }];
const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

function Table({ head, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            {head.map((h, i) => (
              <th key={i} className={`px-5 py-2.5 font-medium sm:px-6 ${h.right ? "text-right" : ""}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

function Overview() {
  const { data, loading, error } = useAsync(() => adminAPI.stats(), []);
  if (error) return <Alert>{error}</Alert>;
  const days = (data?.last14Days || []).map((d) => ({
    key: d.date,
    label: dayFmt.format(new Date(`${d.date}T00:00:00`)).split(" ")[0],
    fullLabel: date(`${d.date}T00:00:00`),
    values: { volume: Number(d.volume) },
    count: d.count,
  }));
  return (
    <div className="space-y-6">
      <Card className="grid grid-cols-1 gap-5 p-5 min-[360px]:grid-cols-2 sm:gap-6 sm:p-6 lg:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)
        ) : (
          <>
            <Stat label="Customers" value={data.users} hint={`${data.activeUsers} active`} />
            <Stat label="Open accounts" value={data.accounts} hint={`${data.frozenAccounts} frozen`} />
            <Stat label="Deposits held" value={money(data.totalDeposits)} />
            <Stat label="Today" value={money(data.volumeToday)} hint={`${data.transactionsToday} transactions`} />
          </>
        )}
      </Card>
      <Card className="p-6">
        <h2 className="text-[15px] font-semibold text-ink">Daily volume</h2>
        <p className="mb-5 mt-0.5 text-sm text-muted">All transactions, last 14 days</p>
        {loading ? (
          <Skeleton className="h-60" />
        ) : (
          <BarChart
            title="Transaction volume per day, last 14 days"
            data={days}
            series={VOLUME}
            format={money}
            axisFormat={moneyCompact}
            extra={(d) => [{ label: "Transactions", value: d.count }]}
          />
        )}
      </Card>
    </div>
  );
}

function Users({ query }) {
  const toast = useToast();
  const { data, loading, error, setData } = useAsync(() => adminAPI.users(), []);
  const [busy, setBusy] = useState(null);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return (data || []).filter((u) => !q || [u.username, u.fullName, u.email].some((s) => s?.toLowerCase().includes(q)));
  }, [data, query]);

  const toggle = async (u) => {
    setBusy(u.id);
    try {
      await adminAPI.setUserActive(u.id, !u.active);
      setData((list) => list.map((x) => (x.id === u.id ? { ...x, active: !u.active, locked: u.active ? x.locked : false } : x)));
      toast.success(`${u.fullName} ${u.active ? "deactivated" : "reactivated"}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (error) return <Alert>{error}</Alert>;
  return (
    <Card className="overflow-hidden">
      {loading ? (
        <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <Table head={[{ label: "Customer" }, { label: "Status" }, { label: "Accounts", right: true }, { label: "Balance", right: true }, { label: "Last sign-in" }, { label: "" }]}>
          {rows.map((u) => (
            <tr key={u.id} className="hover:bg-subtle/50">
              <td className="px-5 py-3 sm:px-6">
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  {u.fullName}
                  {u.role === "ADMIN" && <ShieldCheck className="size-3.5 text-accent-ink" aria-label="Admin" />}
                </p>
                <p className="text-xs text-faint">
                  @{u.username} · {u.email}
                </p>
              </td>
              <td className="px-5 py-3 sm:px-6">
                <div className="flex flex-wrap gap-1">
                  {u.active ? <Badge tone="accent">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
                  {u.locked && (
                    <Badge tone="warn">
                      <Lock className="size-3" /> Locked
                    </Badge>
                  )}
                </div>
              </td>
              <td className="tabular px-5 py-3 text-right text-ink sm:px-6">{u.accounts}</td>
              <td className="tabular px-5 py-3 text-right text-ink sm:px-6">{money(u.totalBalance)}</td>
              <td className="px-5 py-3 text-muted sm:px-6">{u.lastLoginAt ? dateTime(u.lastLoginAt) : "Never"}</td>
              <td className="px-5 py-3 text-right sm:px-6">
                {u.role !== "ADMIN" && (
                  <Button variant={u.active ? "danger-ghost" : "secondary"} size="sm" loading={busy === u.id} onClick={() => toggle(u)}>
                    {u.active ? "Deactivate" : "Reactivate"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

function Accounts({ query }) {
  const toast = useToast();
  const { data, loading, error, setData } = useAsync(() => adminAPI.accounts(), []);
  const [busy, setBusy] = useState(null);

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    return (data || []).filter(
      (a) => !q || [a.accountNumber, a.ownerFullName, a.ownerUsername, a.nickname].some((s) => s?.toLowerCase().includes(q))
    );
  }, [data, query]);

  const toggle = async (a) => {
    setBusy(a.accountNumber);
    try {
      const updated = await adminAPI.setFrozen(a.accountNumber, !a.frozen);
      setData((list) => list.map((x) => (x.accountNumber === a.accountNumber ? updated : x)));
      toast.success(`Account ${updated.frozen ? "frozen" : "unfrozen"}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  if (error) return <Alert>{error}</Alert>;
  return (
    <Card className="overflow-hidden">
      {loading ? (
        <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <Table head={[{ label: "Account" }, { label: "Holder" }, { label: "Status" }, { label: "Balance", right: true }, { label: "" }]}>
          {rows.map((a) => (
            <tr key={a.accountNumber} className="hover:bg-subtle/50">
              <td className="px-5 py-3 sm:px-6">
                <p className="font-medium text-ink">{accountName(a)}</p>
                <p className="tabular text-xs text-faint">
                  {accountTypeLabel(a.accountType)} · {a.accountNumber}
                </p>
              </td>
              <td className="px-5 py-3 text-muted sm:px-6">{a.ownerFullName}</td>
              <td className="px-5 py-3 sm:px-6">
                {!a.active ? (
                  <Badge>Closed</Badge>
                ) : a.frozen ? (
                  <Badge tone="warn">
                    <Snowflake className="size-3" /> Frozen
                  </Badge>
                ) : (
                  <Badge tone="accent">Open</Badge>
                )}
              </td>
              <td className="tabular px-5 py-3 text-right text-ink sm:px-6">{money(a.balance)}</td>
              <td className="px-5 py-3 text-right sm:px-6">
                {a.active && (
                  <Button variant="secondary" size="sm" icon={Snowflake} loading={busy === a.accountNumber} onClick={() => toggle(a)}>
                    {a.frozen ? "Unfreeze" : "Freeze"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

function Transactions({ query }) {
  const { data, loading, error } = useAsync(() => adminAPI.transactions(), []);
  const rows = (data || []).filter((t) => {
    const q = query.toLowerCase();
    return !q || [t.transactionId, t.fromName, t.toName, t.fromAccountNumber, t.toAccountNumber, t.description].some((s) => s?.toLowerCase().includes(q));
  });
  if (error) return <Alert>{error}</Alert>;
  return (
    <Card className="overflow-hidden">
      {loading ? (
        <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : (
        <Table head={[{ label: "When" }, { label: "Type" }, { label: "From" }, { label: "To" }, { label: "Amount", right: true }]}>
          {rows.map((t) => (
            <tr key={t.transactionId} className="hover:bg-subtle/50">
              <td className="px-5 py-3 sm:px-6">
                <p className="text-ink">{dateTime(t.transactionDate)}</p>
                <p className="tabular text-xs text-faint">{t.transactionId}</p>
              </td>
              <td className="px-5 py-3 text-muted sm:px-6">{t.transactionType.charAt(0) + t.transactionType.slice(1).toLowerCase()}</td>
              <td className="px-5 py-3 text-muted sm:px-6">{t.fromName || "Cash"}</td>
              <td className="px-5 py-3 text-muted sm:px-6">{t.toName || "Cash"}</td>
              <td className="tabular px-5 py-3 text-right font-medium text-ink sm:px-6">
                {money(t.amount)}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");

  return (
    <div className="fade-in">
      <PageHeader title="Admin" description="Bank-wide view. Only admins can see this page." />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "users", label: "Customers" },
            { value: "accounts", label: "Accounts" },
            { value: "transactions", label: "Transactions" },
          ]}
        />
        {tab !== "overview" && (
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <Input className="pl-9" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
          </div>
        )}
      </div>
      {tab === "overview" && <Overview />}
      {tab === "users" && <Users query={query} />}
      {tab === "accounts" && <Accounts query={query} />}
      {tab === "transactions" && <Transactions query={query} />}
    </div>
  );
}
