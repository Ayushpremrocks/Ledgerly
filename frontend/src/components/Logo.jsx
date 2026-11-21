import { cx } from "../lib/format";

/** The Ledgerly mark: three ledger lines on a rounded square. */
export function LogoMark({ className = "size-7" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <rect x="9" y="9.5" width="14" height="2.6" rx="1.3" fill="#fff" />
      <rect x="9" y="14.7" width="9" height="2.6" rx="1.3" fill="#fff" fillOpacity="0.75" />
      <rect x="9" y="19.9" width="12" height="2.6" rx="1.3" fill="#fff" />
    </svg>
  );
}

export default function Logo({ className, size = "md" }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={size === "lg" ? "size-9" : "size-7"} />
      <span className={cx("font-semibold tracking-tight text-ink", size === "lg" ? "text-xl" : "text-[17px]")}>
        Ledgerly
      </span>
    </span>
  );
}
