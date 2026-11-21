import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Send, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, UserCheck, AlertCircle, Wallet, BookmarkPlus } from "lucide-react";
import { Alert, Button, Card, DetailRow, EmptyState, Field, Input, PageHeader, Segmented, Select, Skeleton, Spinner } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { accountAPI, beneficiaryAPI, errorMessage, transactionAPI } from "../lib/api";
import { CATEGORIES, LIMITS, accountName, categoryLabel } from "../lib/constants";
import { dateTime, maskAccount, money } from "../lib/format";
import { useAsync } from "../lib/useAsync";

const TABS = [
  { value: "transfer", label: "Send", icon: Send },
  { value: "deposit", label: "Deposit", icon: ArrowDownToLine },
  { value: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
];

const accountOption = (a) => `${accountName(a)} · ${maskAccount(a.accountNumber)} · ${money(a.balance)}`;

/** Amount field with live checks against balance and limits. */
function AmountField({ value, onChange, max, error }) {
  return (
    <Field label="Amount" error={error} hint={max != null ? `Available ${money(max)}` : null}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          aria-describedby={describedBy}
          invalid={invalid}
          prefix="₹"
          type="number"
          inputMode="decimal"
          min="1"
          step="0.01"
          placeholder="0.00"
          className="h-12 text-lg font-semibold tabular"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

function CategoryField({ value, onChange }) {
  return (
    <Field label="Category">
      {({ id }) => (
        <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

function Receipt({ title, tx, children, onAgain }) {
  return (
    <Card className="fade-in mx-auto max-w-lg p-6 text-center sm:p-8">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent-soft">
        <CheckCircle2 className="size-6 text-accent-ink" />
      </div>
      <p className="mt-4 text-sm text-muted">{title}</p>
      <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-ink">{money(tx.amount)}</p>
      <div className="mt-6 divide-y divide-line text-left">
        <DetailRow label="Reference">
          <span className="tabular">{tx.transactionId}</span>
        </DetailRow>
        <DetailRow label="When">{dateTime(tx.transactionDate)}</DetailRow>
        <DetailRow label="Category">{categoryLabel(tx.category)}</DetailRow>
        {tx.description && <DetailRow label="Note">{tx.description}</DetailRow>}
      </div>
      {children}
      <div className="mt-6 flex justify-center gap-2">
        <Button variant="secondary" onClick={onAgain}>
          Make another
        </Button>
        <Button to="/overview">Done</Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- Send

function TransferForm({ accounts, payees, params, onDone, reloadPayees }) {
  const toast = useToast();
  const open = accounts.filter((a) => a.active && !a.frozen);
  const [from, setFrom] = useState(params.get("from") || open[0]?.accountNumber || "");
  const [mode, setMode] = useState(params.get("to") ? "number" : payees.length ? "payee" : "number");
  const [payeeId, setPayeeId] = useState(payees[0]?.id ? String(payees[0].id) : "");
  const [ownTo, setOwnTo] = useState("");
  const [number, setNumber] = useState(params.get("to") || "");
  const [lookup, setLookup] = useState({ state: "idle" });
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [note, setNote] = useState("");
  const [step, setStep] = useState("form"); // form | review | done
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState(false);

  const fromAcc = open.find((a) => a.accountNumber === from);
  const ownTargets = open.filter((a) => a.accountNumber !== from);

  // Verify a typed account number as soon as it's complete (ACC + 13 digits)
  const cleanNumber = number.trim().toUpperCase();
  useEffect(() => {
    if (mode !== "number" || cleanNumber.length < 16) {
      setLookup({ state: "idle" });
      return;
    }
    let alive = true;
    setLookup({ state: "loading" });
    const t = setTimeout(() => {
      accountAPI
        .lookup(cleanNumber)
        .then((d) => alive && setLookup({ state: "ok", data: d }))
        .catch((err) => alive && setLookup({ state: "error", error: errorMessage(err, "No account found with that number") }));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [cleanNumber, mode]);

  const target = useMemo(() => {
    if (mode === "payee") {
      const p = payees.find((x) => String(x.id) === payeeId);
      return p ? { number: p.accountNumber, name: p.nickname, sub: p.ownerName } : null;
    }
    if (mode === "own") {
      const a = ownTargets.find((x) => x.accountNumber === ownTo) || ownTargets[0];
      return a ? { number: a.accountNumber, name: accountName(a), sub: "Your account", own: true } : null;
    }
    if (lookup.state === "ok" && lookup.data.canReceive) {
      return { number: lookup.data.accountNumber, name: lookup.data.ownerName, sub: maskAccount(lookup.data.accountNumber) };
    }
    return null;
  }, [mode, payees, payeeId, ownTargets, ownTo, lookup]);

  const value = Number(amount);
  const amountError =
    amount === ""
      ? null
      : !(value > 0)
        ? "Enter an amount"
        : value < 1
          ? "The minimum is ₹1.00"
          : value > LIMITS.perTransaction
            ? `The maximum per transfer is ${money(LIMITS.perTransaction)}`
            : fromAcc && value > Number(fromAcc.balance)
              ? "That's more than this account has"
              : null;

  const sameAccount = target && target.number === from;
  const canReview = fromAcc && target && !sameAccount && amount !== "" && !amountError;

  const send = async () => {
    setSending(true);
    setError("");
    try {
      const tx = await transactionAPI.transfer({
        fromAccountNumber: from,
        toAccountNumber: target.number,
        amount: value,
        category,
        description: note.trim() || null,
      });
      setResult({ tx, target });
      setStep("done");
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setStep("form");
    } finally {
      setSending(false);
    }
  };

  const savePayee = async () => {
    try {
      await beneficiaryAPI.add({ accountNumber: result.target.number, nickname: saveName.trim() });
      setSaved(true);
      toast.success("Payee saved");
      reloadPayees();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const reset = () => {
    setAmount("");
    setNote("");
    setStep("form");
    setResult(null);
    setSaved(false);
    setSaveName("");
  };

  if (open.length === 0) {
    return (
      <Card>
        <EmptyState icon={Wallet} title="No account to send from" description="Open an account first." action={<Button to="/accounts?new=1">Open account</Button>} />
      </Card>
    );
  }

  if (step === "done" && result) {
    const isNewPayee = mode === "number" && !payees.some((p) => p.accountNumber === result.target.number);
    return (
      <Receipt title={`Sent to ${result.target.name}`} tx={result.tx} onAgain={reset}>
        {isNewPayee && !saved && (
          <div className="mt-6 rounded-xl border border-line p-4 text-left">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <BookmarkPlus className="size-4 text-faint" /> Save as a payee?
            </p>
            <div className="mt-3 flex gap-2">
              <Input placeholder="Name, e.g. Landlord" value={saveName} maxLength={40} onChange={(e) => setSaveName(e.target.value)} aria-label="Payee name" />
              <Button variant="secondary" onClick={savePayee} disabled={!saveName.trim()}>
                Save
              </Button>
            </div>
          </div>
        )}
      </Receipt>
    );
  }

  if (step === "review") {
    return (
      <Card className="fade-in mx-auto max-w-lg p-6 sm:p-8">
        <h2 className="text-base font-semibold text-ink">Check the details</h2>
        <p className="mt-1 text-sm text-muted">Transfers are instant and can't be undone.</p>
        <p className="tabular mt-6 text-3xl font-semibold tracking-tight text-ink">{money(value)}</p>
        <div className="mt-4 divide-y divide-line">
          <DetailRow label="From">
            {accountName(fromAcc)} <span className="text-faint">{maskAccount(fromAcc.accountNumber)}</span>
          </DetailRow>
          <DetailRow label="To">
            {target.name} <span className="text-faint">{target.sub}</span>
          </DetailRow>
          <DetailRow label="Category">{categoryLabel(category)}</DetailRow>
          {note.trim() && <DetailRow label="Note">{note.trim()}</DetailRow>}
          <DetailRow label="Balance after">{money(Number(fromAcc.balance) - value)}</DetailRow>
        </div>
        <div className="mt-8 flex gap-2">
          <Button variant="secondary" onClick={() => setStep("form")} className="flex-1">
            Edit
          </Button>
          <Button onClick={send} loading={sending} className="flex-1">
            Send {money(value)}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg p-6 sm:p-8">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canReview) setStep("review");
        }}
      >
        {error && <Alert>{error}</Alert>}
        <Field label="From">
          {({ id }) => (
            <Select id={id} value={from} onChange={(e) => setFrom(e.target.value)}>
              {open.map((a) => (
                <option key={a.accountNumber} value={a.accountNumber}>
                  {accountOption(a)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink">To</span>
            <Segmented
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: "payee", label: "Payee" },
                { value: "own", label: "My account" },
                { value: "number", label: "Account no." },
              ]}
            />
          </div>

          {mode === "payee" &&
            (payees.length ? (
              <Select value={payeeId} onChange={(e) => setPayeeId(e.target.value)} aria-label="Payee">
                {payees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname} · {p.ownerName} · {maskAccount(p.accountNumber)}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="rounded-lg border border-dashed border-line px-3 py-3 text-sm text-muted">
                No saved payees yet.{" "}
                <Link to="/payees" className="font-medium text-accent-ink hover:underline">
                  Add one
                </Link>{" "}
                or use an account number.
              </p>
            ))}

          {mode === "own" &&
            (ownTargets.length ? (
              <Select value={ownTo || ownTargets[0].accountNumber} onChange={(e) => setOwnTo(e.target.value)} aria-label="Your account">
                {ownTargets.map((a) => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {accountOption(a)}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="rounded-lg border border-dashed border-line px-3 py-3 text-sm text-muted">You only have one open account.</p>
            ))}

          {mode === "number" && (
            <>
              <Input
                placeholder="ACC0000000000000"
                value={number}
                onChange={(e) => setNumber(e.target.value.toUpperCase().replace(/\s/g, ""))}
                maxLength={20}
                className="tabular uppercase"
                aria-label="Account number"
                autoComplete="off"
              />
              {lookup.state === "loading" && (
                <p className="flex items-center gap-2 text-[13px] text-faint">
                  <Spinner className="size-3.5" /> Checking…
                </p>
              )}
              {lookup.state === "ok" &&
                (lookup.data.canReceive ? (
                  <p className="flex items-center gap-2 text-[13px] text-accent-ink">
                    <UserCheck className="size-4" /> {lookup.data.ownerName}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-[13px] text-danger">
                    <AlertCircle className="size-4" /> This account can't receive payments right now
                  </p>
                ))}
              {lookup.state === "error" && (
                <p className="flex items-center gap-2 text-[13px] text-danger">
                  <AlertCircle className="size-4" /> {lookup.error}
                </p>
              )}
            </>
          )}
          {sameAccount && <p className="text-[13px] text-danger">Choose a different account than the one you're sending from.</p>}
        </div>

        <AmountField value={amount} onChange={setAmount} max={fromAcc?.balance} error={amountError} />
        <div className="grid gap-5 sm:grid-cols-2">
          <CategoryField value={category} onChange={setCategory} />
          <Field label="Note" optional>
            {({ id }) => <Input id={id} maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's it for?" />}
          </Field>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!canReview}>
          Review
        </Button>
        <p className="text-center text-xs text-faint">
          Up to {money(LIMITS.perTransaction)} per transfer and {money(LIMITS.dailyTransfer)} a day to other people.
        </p>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------- Deposit / withdraw

function CashForm({ kind, accounts, params, onDone }) {
  const open = accounts.filter((a) => a.active && !a.frozen);
  const isDeposit = kind === "deposit";
  const [account, setAccount] = useState(params.get("account") || open[0]?.accountNumber || "");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(isDeposit ? "SALARY" : "OTHER");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tx, setTx] = useState(null);

  const acc = open.find((a) => a.accountNumber === account);
  const value = Number(amount);
  const limit = isDeposit ? LIMITS.maxDeposit : LIMITS.perTransaction;
  const amountError =
    amount === ""
      ? null
      : !(value >= 1)
        ? "The minimum is ₹1.00"
        : value > limit
          ? `The maximum is ${money(limit)}`
          : !isDeposit && acc && value > Number(acc.balance)
            ? "That's more than this account has"
            : null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { accountNumber: account, amount: value, category, description: note.trim() || null };
      setTx(isDeposit ? await transactionAPI.deposit(body) : await transactionAPI.withdraw(body));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (open.length === 0) {
    return (
      <Card>
        <EmptyState icon={Wallet} title="No open account" description="Open an account first." action={<Button to="/accounts?new=1">Open account</Button>} />
      </Card>
    );
  }

  if (tx) {
    return (
      <Receipt
        title={isDeposit ? `Deposited into ${accountName(acc)}` : `Withdrawn from ${accountName(acc)}`}
        tx={tx}
        onAgain={() => {
          setTx(null);
          setAmount("");
          setNote("");
        }}
      />
    );
  }

  return (
    <Card className="mx-auto max-w-lg p-6 sm:p-8">
      <form onSubmit={submit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <Field label={isDeposit ? "Into" : "From"}>
          {({ id }) => (
            <Select id={id} value={account} onChange={(e) => setAccount(e.target.value)}>
              {open.map((a) => (
                <option key={a.accountNumber} value={a.accountNumber}>
                  {accountOption(a)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <AmountField value={amount} onChange={setAmount} max={isDeposit ? null : acc?.balance} error={amountError} />
        <div className="grid gap-5 sm:grid-cols-2">
          <CategoryField value={category} onChange={setCategory} />
          <Field label="Note" optional>
            {({ id }) => <Input id={id} maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!acc || amount === "" || !!amountError}>
          {isDeposit ? "Deposit" : "Withdraw"} {value > 0 && !amountError ? money(value) : ""}
        </Button>
        <p className="text-center text-xs text-faint">
          {isDeposit ? `Up to ${money(LIMITS.maxDeposit)} per deposit.` : `Up to ${money(LIMITS.perTransaction)} per withdrawal.`} Ledgerly is a demo, so no real cash moves.
        </p>
      </form>
    </Card>
  );
}

export default function MoveMoney() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get("tab")) ? params.get("tab") : "transfer";
  const { data, loading, error, reload } = useAsync(() => Promise.all([accountAPI.list(), beneficiaryAPI.list()]), []);
  const [accounts, payees] = data || [];

  return (
    <div className="fade-in">
      <PageHeader title="Move money" description="Send to anyone with a Ledgerly account, or add and take out cash." />
      <div className="mb-6 flex justify-center">
        <Segmented options={TABS} value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} />
      </div>
      {error && <Alert className="mx-auto mb-6 max-w-lg">{error}</Alert>}
      {loading ? (
        <Card className="mx-auto max-w-lg space-y-5 p-8">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-12" />
        </Card>
      ) : tab === "transfer" ? (
        <TransferForm
          key="transfer"
          accounts={accounts}
          payees={payees}
          params={params}
          onDone={() => reload({ silent: true })}
          reloadPayees={() => reload({ silent: true })}
        />
      ) : (
        <CashForm key={tab} kind={tab} accounts={accounts} params={params} onDone={() => reload({ silent: true })} />
      )}
    </div>
  );
}
