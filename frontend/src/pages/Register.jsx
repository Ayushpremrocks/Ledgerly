import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { Alert, Button, Field, Input } from "../components/ui";
import PasswordChecklist, { passwordOk as isPasswordOk } from "../components/PasswordChecklist";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", phoneNumber: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const passwordOk = isPasswordOk(form.password);
  const phoneOk = !form.phoneNumber || /^\d{10}$/.test(form.phoneNumber);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!passwordOk) return setError("Your password doesn't meet all the rules yet.");
    if (!phoneOk) return setError("Phone number must be 10 digits.");
    setLoading(true);
    const res = await register({
      ...form,
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber || null,
    });
    setLoading(false);
    if (res.success) navigate("/login?registered=1");
    else setError(res.error);
  };

  return (
    <AuthShell
      title="Create your profile"
      subtitle="It takes a minute. You can open accounts right after."
      footer={
        <>
          Already have a profile?{" "}
          <Link to="/login" className="font-medium text-accent-ink hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {error && <Alert>{error}</Alert>}

        <Field label="Full name">
          {({ id }) => <Input id={id} autoComplete="name" autoFocus value={form.fullName} onChange={set("fullName")} required />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Username" hint="3–50 characters">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} autoComplete="username" value={form.username} onChange={set("username")} required />
            )}
          </Field>
          <Field label="Phone" optional error={!phoneOk ? "10 digits" : null}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                inputMode="numeric"
                autoComplete="tel-national"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              />
            )}
          </Field>
        </div>
        <Field label="Email">
          {({ id }) => <Input id={id} type="email" autoComplete="email" value={form.email} onChange={set("email")} required />}
        </Field>
        <Field label="Password">
          {({ id }) => (
            <>
              <Input id={id} type="password" autoComplete="new-password" value={form.password} onChange={set("password")} required />
              <PasswordChecklist password={form.password} />
            </>
          )}
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={!form.fullName || !form.username || !form.email || !form.password}
        >
          Create profile
        </Button>
      </form>
    </AuthShell>
  );
}
