import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "./AuthShell";
import { Alert, Button, Field, Input } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(form.username.trim(), form.password);
    setLoading(false);
    if (res.success) navigate(location.state?.from || "/overview", { replace: true });
    else setError(res.error);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your accounts."
      footer={
        <>
          New to Ledgerly?{" "}
          <Link to="/register" className="font-medium text-accent-ink hover:underline">
            Create a profile
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {params.get("expired") && !error && <Alert tone="info">Your session ended. Please sign in again.</Alert>}
        {params.get("registered") && !error && <Alert tone="success">Profile created. Sign in to get started.</Alert>}
        {error && <Alert>{error}</Alert>}

        <Field label="Username">
          {({ id }) => (
            <Input
              id={id}
              autoComplete="username"
              autoFocus
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          )}
        </Field>

        <Field label="Password">
          {({ id }) => (
            <div className="relative">
              <Input
                id={id}
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-faint hover:text-ink"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          )}
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!form.username || !form.password}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
