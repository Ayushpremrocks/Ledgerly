import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Wallet } from "lucide-react";
import { Alert, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Skeleton } from "../components/ui";
import AccountCard from "../components/AccountCard";
import { useToast } from "../context/ToastContext";
import { accountAPI, errorMessage } from "../lib/api";
import { ACCOUNT_TYPES, LIMITS } from "../lib/constants";
import { cx, money } from "../lib/format";
import { useAsync } from "../lib/useAsync";

function OpenAccountModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ accountType: "SAVINGS", nickname: "", openingDeposit: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const acc = await accountAPI.create({
        accountType: form.accountType,
        nickname: form.nickname.trim() || null,
        openingDeposit: form.openingDeposit ? Number(form.openingDeposit) : 0,
      });
      setForm({ accountType: "SAVINGS", nickname: "", openingDeposit: "" });
      onCreated(acc);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Open an account"
      description="It's ready to use right away."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="open-account" loading={saving}>
            Open account
          </Button>
        </>
      }
    >
      <form id="open-account" onSubmit={submit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink">Type</legend>
          <div className="space-y-2">
            {ACCOUNT_TYPES.map((t) => (
              <label
                key={t.value}
                className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                  form.accountType === t.value ? "border-accent bg-accent-soft/50" : "border-line hover:bg-subtle"
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={t.value}
                  checked={form.accountType === t.value}
                  onChange={() => setForm({ ...form, accountType: t.value })}
                  className="mt-0.5 accent-[var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">{t.label}</span>
                  <span className="block text-xs text-muted">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Nickname" optional hint='e.g. "Rainy day fund"'>
          {({ id, describedBy }) => (
            <Input id={id} aria-describedby={describedBy} maxLength={40} value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          )}
        </Field>
        <Field label="Opening deposit" optional hint={`Up to ${money(LIMITS.maxDeposit)}`}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              prefix="₹"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.openingDeposit}
              onChange={(e) => setForm({ ...form, openingDeposit: e.target.value })}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}

export default function Accounts() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: accounts, loading, error, reload } = useAsync(() => accountAPI.list(), []);
  const modalOpen = params.get("new") === "1";

  const open = accounts?.filter((a) => a.active) || [];
  const closed = accounts?.filter((a) => !a.active) || [];

  const setModal = (v) => setParams(v ? { new: "1" } : {}, { replace: true });

  return (
    <div className="fade-in">
      <PageHeader
        title="Accounts"
        description="Everything you hold with Ledgerly."
        actions={<Button icon={Plus} onClick={() => setModal(true)}>Open account</Button>}
      />
      {error && <Alert className="mb-6">{error}</Alert>}

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
            title="No open accounts"
            description="Open one to start depositing and sending money."
            action={<Button icon={Plus} onClick={() => setModal(true)}>Open account</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {open.map((a) => (
            <AccountCard key={a.accountNumber} account={a} />
          ))}
        </div>
      )}

      {closed.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-muted">Closed</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {closed.map((a) => (
              <AccountCard key={a.accountNumber} account={a} />
            ))}
          </div>
        </section>
      )}

      <OpenAccountModal
        open={modalOpen}
        onClose={() => setModal(false)}
        onCreated={(acc) => {
          toast.success("Account opened");
          reload({ silent: true });
          navigate(`/accounts/${acc.accountNumber}`);
        }}
      />
    </div>
  );
}
