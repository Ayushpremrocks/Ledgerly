import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
  Pencil,
  Copy,
  Check,
  Snowflake,
  ReceiptText,
  Lock,
} from "lucide-react";
import { Alert, Badge, Button, Card, CardHeader, DetailRow, EmptyState, Field, Input, Modal, Skeleton } from "../components/ui";
import TransactionList from "../components/TransactionList";
import { useToast } from "../context/ToastContext";
import { accountAPI, errorMessage, transactionAPI } from "../lib/api";
import { accountName, accountTypeLabel } from "../lib/constants";
import { date, isoDay, money, spacedAccount } from "../lib/format";
import { useAsync } from "../lib/useAsync";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard blocked; the number is still visible to copy by hand
        }
      }}
      className="rounded-md p-1 text-faint hover:bg-subtle hover:text-ink pointer-coarse:p-2"
      aria-label="Copy account number"
    >
      {copied ? <Check className="size-3.5 text-accent-ink" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function StatementModal({ open, onClose, accountNumber }) {
  const toast = useToast();
  const monthStart = new Date();
  monthStart.setDate(1);
  const [from, setFrom] = useState(isoDay(monthStart));
  const [to, setTo] = useState(isoDay());
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const res = await transactionAPI.statement(accountNumber, from, to);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledgerly-${accountNumber}-${from || "start"}-to-${to || "today"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Statement downloaded");
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't create the statement"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Download statement" description="A CSV file that opens in Excel or Google Sheets.">
      <div className="grid grid-cols-2 gap-4">
        <Field label="From">{({ id }) => <Input id={id} type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />}</Field>
        <Field label="To">{({ id }) => <Input id={id} type="date" value={to} min={from} max={isoDay()} onChange={(e) => setTo(e.target.value)} />}</Field>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button icon={Download} onClick={download} loading={busy}>
          Download CSV
        </Button>
      </div>
    </Modal>
  );
}

function RenameModal({ open, onClose, account, onSaved }) {
  const [name, setName] = useState(account?.nickname || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onSaved(await accountAPI.rename(account.accountNumber, name.trim() || null));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Rename account" size="sm">
      <form onSubmit={save} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <Field label="Nickname" hint="Leave empty to use the account type.">
          {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AccountDetail() {
  const { accountNumber } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, setData } = useAsync(
    () => Promise.all([accountAPI.get(accountNumber), transactionAPI.forAccount(accountNumber)]),
    [accountNumber]
  );
  const [modal, setModal] = useState(null); // "statement" | "rename" | "close"
  const [closing, setClosing] = useState(false);

  if (error) {
    return (
      <Card>
        <EmptyState icon={ReceiptText} title="Account not found" description={error} action={<Button to="/accounts" variant="secondary">Back to accounts</Button>} />
      </Card>
    );
  }

  const [account, txns] = data || [];
  const usable = account?.active && !account?.frozen;

  const close = async () => {
    setClosing(true);
    try {
      const updated = await accountAPI.close(accountNumber);
      setData(([, t]) => [updated, t]);
      toast.success("Account closed");
      setModal(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="fade-in space-y-6">
      <Link to="/accounts" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Accounts
      </Link>

      <Card className="p-6 sm:p-8">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-60" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-ink">{accountName(account)}</h1>
                  {account.active && (
                    <button onClick={() => setModal("rename")} className="rounded-md p-1 text-faint hover:bg-subtle hover:text-ink pointer-coarse:p-2" aria-label="Rename account">
                      <Pencil className="size-3.5" />
                    </button>
                  )}
                  {account.frozen && (
                    <Badge tone="warn">
                      <Snowflake className="size-3" /> Frozen
                    </Badge>
                  )}
                  {!account.active && <Badge>Closed</Badge>}
                </div>
                <p className="tabular mt-1 flex items-center gap-1 text-sm text-muted">
                  {spacedAccount(account.accountNumber)}
                  <CopyButton text={account.accountNumber} />
                </p>
              </div>
              <Button variant="secondary" size="sm" icon={Download} onClick={() => setModal("statement")}>
                Statement
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted">Available balance</p>
            <p className="tabular mt-1 text-4xl font-semibold tracking-tight text-ink">{money(account.balance)}</p>

            {account.frozen && (
              <Alert tone="warn" className="mt-6">
                This account is frozen by Ledgerly support. Money can't move in or out until it's unfrozen.
              </Alert>
            )}

            {usable && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button icon={Send} onClick={() => navigate(`/move?tab=transfer&from=${account.accountNumber}`)}>
                  Send
                </Button>
                <Button variant="secondary" icon={ArrowDownToLine} onClick={() => navigate(`/move?tab=deposit&account=${account.accountNumber}`)}>
                  Deposit
                </Button>
                <Button variant="secondary" icon={ArrowUpFromLine} onClick={() => navigate(`/move?tab=withdraw&account=${account.accountNumber}`)}>
                  Withdraw
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader title="History" description="Newest first, with the balance after each one." className="pb-4" />
          {loading ? (
            <div className="space-y-3 px-6 pb-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : txns.length ? (
            <TransactionList items={txns} showBalance />
          ) : (
            <EmptyState icon={ReceiptText} title="No transactions yet" />
          )}
        </Card>

        {!loading && (
          <Card className="h-fit p-6">
            <h2 className="mb-2 text-[15px] font-semibold text-ink">Details</h2>
            <div className="divide-y divide-line">
              <DetailRow label="Type">{accountTypeLabel(account.accountType)}</DetailRow>
              <DetailRow label="Holder">{account.ownerFullName}</DetailRow>
              <DetailRow label="Currency">{account.currency}</DetailRow>
              <DetailRow label="Opened">{date(account.createdAt)}</DetailRow>
              {account.closedAt && <DetailRow label="Closed">{date(account.closedAt)}</DetailRow>}
            </div>
            {account.active && !account.frozen && (
              <Button variant="danger-ghost" size="sm" icon={Lock} className="mt-4 -ml-3" onClick={() => setModal("close")}>
                Close account
              </Button>
            )}
          </Card>
        )}
      </div>

      <StatementModal open={modal === "statement"} onClose={() => setModal(null)} accountNumber={accountNumber} />
      {account && (
        <RenameModal
          key={account.nickname}
          open={modal === "rename"}
          onClose={() => setModal(null)}
          account={account}
          onSaved={(updated) => {
            setData(([, t]) => [updated, t]);
            setModal(null);
            toast.success("Account renamed");
          }}
        />
      )}
      <Modal
        open={modal === "close"}
        onClose={() => setModal(null)}
        title="Close this account?"
        description="You can't reopen a closed account. Its history stays available."
        size="sm"
      >
        {account && Number(account.balance) !== 0 && (
          <Alert tone="warn" className="mb-4">
            Move the remaining {money(account.balance)} to another account first.
          </Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>
            Keep it
          </Button>
          <Button variant="danger" onClick={close} loading={closing} disabled={account && Number(account.balance) !== 0}>
            Close account
          </Button>
        </div>
      </Modal>
    </div>
  );
}
