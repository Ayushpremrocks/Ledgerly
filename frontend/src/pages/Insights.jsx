import { ChartColumn, TrendingDown, TrendingUp } from "lucide-react";
import { Alert, Card, CardHeader, EmptyState, PageHeader, Skeleton, Stat } from "../components/ui";
import BarChart from "../components/charts/BarChart";
import BarList from "../components/charts/BarList";
import { insightsAPI } from "../lib/api";
import { categoryLabel } from "../lib/constants";
import { longMonth, money, moneyCompact, shortMonth } from "../lib/format";
import { useAsync } from "../lib/useAsync";

const SERIES = [
  { key: "in", label: "Money in", color: "var(--series-in)" },
  { key: "out", label: "Money out", color: "var(--series-out)" },
];

function Change({ now, before }) {
  if (!before) return <span className="text-faint">No spending last month to compare</span>;
  const pct = ((now - before) / before) * 100;
  const up = pct > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 text-faint">
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(pct).toFixed(0)}% {up ? "more" : "less"} than last month
    </span>
  );
}

export default function Insights() {
  const { data, loading, error } = useAsync(() => insightsAPI.get(), []);

  const months = (data?.months || []).map((m) => ({
    key: m.month,
    label: shortMonth(m.month),
    fullLabel: longMonth(m.month),
    values: { in: Number(m.moneyIn), out: Number(m.moneyOut) },
  }));
  const hasHistory = months.some((m) => m.values.in || m.values.out);
  const out = Number(data?.moneyOutThisMonth || 0);
  const inn = Number(data?.moneyInThisMonth || 0);

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Insights" description="Where your money came from and where it went. Transfers between your own accounts aren't counted." />
      {error && <Alert>{error}</Alert>}

      <Card className="grid grid-cols-1 gap-5 p-5 min-[360px]:grid-cols-2 sm:gap-6 sm:p-6 lg:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)
        ) : (
          <>
            <Stat label="In this month" value={money(inn)} />
            <Stat label="Out this month" value={money(out)} hint={<Change now={out} before={Number(data.moneyOutLastMonth)} />} />
            <Stat label="Net this month" value={(inn - out >= 0 ? "+" : "−") + money(Math.abs(inn - out))} />
            <Stat label="Transactions" value={data.transactionsThisMonth} hint="this month" />
          </>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-[15px] font-semibold text-ink">Money in and out</h2>
        <p className="mb-5 mt-0.5 text-sm text-muted">Last 6 months</p>
        {loading ? (
          <Skeleton className="h-60" />
        ) : hasHistory ? (
          <BarChart
            title="Money in and out over the last 6 months"
            data={months}
            series={SERIES}
            format={money}
            axisFormat={moneyCompact}
            extra={(d) => [{ label: "Net", value: (d.values.in - d.values.out >= 0 ? "+" : "−") + money(Math.abs(d.values.in - d.values.out)) }]}
          />
        ) : (
          <EmptyState icon={ChartColumn} title="Nothing to chart yet" description="Make a deposit or a transfer and it'll show up here." />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Spending by category" description="This month" />
          <div className="p-6 pt-5">
            {loading ? (
              <Skeleton className="h-40" />
            ) : data.spendingByCategory.length ? (
              <BarList
                format={money}
                items={data.spendingByCategory.map((c) => ({
                  key: c.category,
                  label: categoryLabel(c.category),
                  sub: `${c.count} payment${c.count === 1 ? "" : "s"}`,
                  value: Number(c.amount),
                }))}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted">No spending this month.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Who you paid most" description="Last 90 days" />
          <div className="p-6 pt-5">
            {loading ? (
              <Skeleton className="h-40" />
            ) : data.topPayees.length ? (
              <BarList
                format={money}
                items={data.topPayees.map((p) => ({
                  key: p.accountNumber,
                  label: p.name,
                  sub: `${p.count} transfer${p.count === 1 ? "" : "s"}`,
                  value: Number(p.amount),
                }))}
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted">No transfers to other people yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
