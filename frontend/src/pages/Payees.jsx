import { useEffect, useState } from "react";
import { Plus, Users, Send, Trash2, UserCheck, AlertCircle } from "lucide-react";
import { Alert, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Skeleton, Spinner } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { accountAPI, beneficiaryAPI, errorMessage } from "../lib/api";
import { initials, spacedAccount } from "../lib/format";
import { useAsync } from "../lib/useAsync";

function AddPayeeModal({ open, onClose, onAdded }) {
  const [number, setNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [lookup, setLookup] = useState({ state: "idle" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const clean = number.trim().toUpperCase();
  useEffect(() => {
    if (clean.length < 16) {
      setLookup({ state: "idle" });
      return;
    }
    let alive = true;
    setLookup({ state: "loading" });
    accountAPI
      .lookup(clean)
      .then((d) => {
        if (!alive) return;
        setLookup({ state: "ok", data: d });
        setNickname((n) => n || d.ownerName.replace(/\s\w\.$/, ""));
      })
      .catch((err) => alive && setLookup({ state: "error", error: errorMessage(err) }));
    return () => {
      alive = false;
    };
  }, [clean]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const p = await beneficiaryAPI.add({ accountNumber: clean, nickname: nickname.trim() });
      setNumber("");
      setNickname("");
      onAdded(p);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a payee" description="Save someone you pay often.">
      <form onSubmit={save} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <Field label="Account number">
          {({ id }) => (
            <>
              <Input
                id={id}
                className="tabular uppercase"
                placeholder="ACC0000000000000"
                maxLength={20}
                autoComplete="off"
                value={number}
                onChange={(e) => setNumber(e.target.value.toUpperCase().replace(/\s/g, ""))}
              />
              {lookup.state === "loading" && (
                <p className="mt-1.5 flex items-center gap-2 text-[13px] text-faint">
                  <Spinner className="size-3.5" /> Checking…
                </p>
              )}
              {lookup.state === "ok" && (
                <p className="mt-1.5 flex items-center gap-2 text-[13px] text-accent-ink">
                  <UserCheck className="size-4" /> {lookup.data.ownerName}
                </p>
              )}
              {lookup.state === "error" && (
                <p className="mt-1.5 flex items-center gap-2 text-[13px] text-danger">
                  <AlertCircle className="size-4" /> {lookup.error}
                </p>
              )}
            </>
          )}
        </Field>
        <Field label="Name" hint="How it shows up when you send money.">
          {({ id, describedBy }) => (
            <Input id={id} aria-describedby={describedBy} maxLength={40} value={nickname} onChange={(e) => setNickname(e.target.value)} />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} disabled={lookup.state !== "ok" || !nickname.trim()}>
            Save payee
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Payees() {
  const toast = useToast();
  const { data: payees, loading, error, setData } = useAsync(() => beneficiaryAPI.list(), []);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);

  const remove = async () => {
    try {
      await beneficiaryAPI.remove(removing.id);
      setData((list) => list.filter((p) => p.id !== removing.id));
      toast.success(`${removing.nickname} removed`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
    setRemoving(null);
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Payees"
        description="People you send money to, saved for next time."
        actions={<Button icon={Plus} onClick={() => setAdding(true)}>Add payee</Button>}
      />
      {error && <Alert className="mb-6">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : payees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No payees yet"
            description="Add someone's account number once, then pay them in two taps."
            action={<Button icon={Plus} onClick={() => setAdding(true)}>Add payee</Button>}
          />
        ) : (
          <ul className="divide-y divide-line">
            {payees.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-subtle text-sm font-semibold text-muted">
                  {initials(p.nickname)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{p.nickname}</p>
                  <p className="tabular truncate text-xs text-faint">
                    {p.ownerName} · {spacedAccount(p.accountNumber)}
                  </p>
                </div>
                <Button variant="secondary" size="sm" icon={Send} to={`/move?tab=transfer&to=${p.accountNumber}`}>
                  <span className="hidden sm:inline">Send</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setRemoving(p)} aria-label={`Remove ${p.nickname}`}>
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AddPayeeModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={(p) => {
          setData((list) => [...(list || []), p].sort((a, b) => a.nickname.localeCompare(b.nickname)));
          setAdding(false);
          toast.success(`${p.nickname} added`);
        }}
      />
      <Modal open={!!removing} onClose={() => setRemoving(null)} title={`Remove ${removing?.nickname}?`} description="You can add them again any time." size="sm">
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setRemoving(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={remove}>
            Remove
          </Button>
        </div>
      </Modal>
    </div>
  );
}
