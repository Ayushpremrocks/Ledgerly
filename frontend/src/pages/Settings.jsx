import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Alert, Button, Card, Field, Input, PageHeader, Segmented, Skeleton } from "../components/ui";
import PasswordChecklist, { passwordOk } from "../components/PasswordChecklist";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { errorMessage, userAPI } from "../lib/api";
import { dateTime, date } from "../lib/format";
import { useAsync } from "../lib/useAsync";

function Section({ title, description, children }) {
  return (
    <Card className="grid gap-6 p-5 sm:p-8 xl:grid-cols-3 xl:gap-10">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="min-w-0 xl:col-span-2">{children}</div>
    </Card>
  );
}

function ProfileForm({ profile, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ fullName: "", email: "", phoneNumber: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) setForm({ fullName: profile.fullName, email: profile.email, phoneNumber: profile.phoneNumber || "" });
  }, [profile]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const updated = await userAPI.update(form);
      onSaved(updated);
      toast.success("Profile saved");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const dirty =
    profile && (form.fullName !== profile.fullName || form.email !== profile.email || form.phoneNumber !== (profile.phoneNumber || ""));

  return (
    <form onSubmit={save} className="space-y-5">
      {error && <Alert>{error}</Alert>}
      <Field label="Full name">{({ id }) => <Input id={id} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />}</Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email">{({ id }) => <Input id={id} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
        <Field label="Phone" optional>
          {({ id }) => (
            <Input
              id={id}
              inputMode="numeric"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
            />
          )}
        </Field>
      </div>
      <Field label="Username" hint="Usernames can't be changed.">
        {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} value={profile?.username || ""} disabled />}
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={busy} disabled={!dirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const mismatch = form.confirm && form.confirm !== form.newPassword;
  const ready = form.currentPassword && passwordOk(form.newPassword) && form.confirm === form.newPassword;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await userAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      {error && <Alert>{error}</Alert>}
      <Field label="Current password">
        {({ id }) => <Input id={id} type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />}
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="New password">
          {({ id }) => (
            <>
              <Input id={id} type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
              {form.newPassword && <PasswordChecklist password={form.newPassword} />}
            </>
          )}
        </Field>
        <Field label="Confirm new password" error={mismatch ? "Passwords don't match" : null}>
          {({ id, invalid }) => (
            <Input id={id} type="password" autoComplete="new-password" invalid={invalid} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          )}
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={busy} disabled={!ready}>
          Change password
        </Button>
      </div>
    </form>
  );
}

export default function Settings() {
  const { updateUser } = useAuth();
  const { preference, setTheme } = useTheme();
  const { data: profile, loading, error, setData } = useAsync(() => userAPI.me(), []);

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Settings" description="Your profile, security and how Ledgerly looks." />
      {error && <Alert>{error}</Alert>}

      <Section title="Profile" description="Shown on your accounts and to people you pay (partly hidden).">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <ProfileForm
            profile={profile}
            onSaved={(p) => {
              setData(p);
              updateUser({ fullName: p.fullName, email: p.email });
            }}
          />
        )}
      </Section>

      <Section
        title="Security"
        description={
          profile?.lastLoginAt
            ? `Last sign-in ${dateTime(profile.lastLoginAt)}. After 5 wrong passwords, sign-in pauses for 15 minutes.`
            : "After 5 wrong passwords, sign-in pauses for 15 minutes."
        }
      >
        <PasswordForm />
      </Section>

      <Section title="Appearance" description="Follow your device, or pick one.">
        <Segmented
          value={preference}
          onChange={setTheme}
          options={[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ]}
        />
      </Section>

      {profile && <p className="text-center text-xs text-faint">Member since {date(profile.createdAt)}</p>}
    </div>
  );
}
