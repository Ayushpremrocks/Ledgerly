import { Button } from "../components/ui";
import { LogoMark } from "../components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 text-center">
      <LogoMark className="size-10" />
      <p className="tabular mt-8 text-sm font-medium text-accent-ink">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">This page doesn't exist</h1>
      <p className="mt-2 text-sm text-muted">The link may be old, or the address has a typo.</p>
      <Button to="/" className="mt-8">
        Go to Ledgerly
      </Button>
    </div>
  );
}
