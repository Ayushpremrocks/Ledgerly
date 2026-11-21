import { Link } from "react-router-dom";
import { ChevronRight, Snowflake } from "lucide-react";
import { Badge } from "./ui";
import { accountName, accountTypeLabel } from "../lib/constants";
import { cx, maskAccount, money } from "../lib/format";

export default function AccountCard({ account, className }) {
  const closed = !account.active;
  return (
    <Link
      to={`/accounts/${account.accountNumber}`}
      className={cx(
        "group flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong",
        closed && "opacity-60",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{accountName(account)}</p>
          <p className="tabular mt-0.5 text-xs text-faint">
            {account.nickname ? `${accountTypeLabel(account.accountType)} · ` : ""}
            {maskAccount(account.accountNumber)}
          </p>
        </div>
        {account.frozen ? (
          <Badge tone="warn">
            <Snowflake className="size-3" aria-hidden /> Frozen
          </Badge>
        ) : closed ? (
          <Badge>Closed</Badge>
        ) : (
          <ChevronRight className="size-4 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
        )}
      </div>
      <p className="tabular mt-6 text-xl font-semibold tracking-tight text-ink">{money(account.balance)}</p>
    </Link>
  );
}
