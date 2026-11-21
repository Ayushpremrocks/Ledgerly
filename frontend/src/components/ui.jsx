// Ledgerly's small UI kit. Every page is built from these, so the look stays consistent.
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X, Loader2, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { cx } from "../lib/format";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";
const buttonVariants = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border border-line bg-surface text-ink hover:bg-subtle",
  ghost: "text-muted hover:bg-subtle hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
  "danger-ghost": "text-danger hover:bg-danger-soft",
};
const buttonSizes = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
  icon: "size-9",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  to,
  className,
  children,
  disabled,
  ...props
}) {
  const classes = cx(buttonBase, buttonVariants[variant], buttonSizes[size], className);
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cx("rounded-2xl border border-line bg-surface", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cx("flex items-start justify-between gap-4 px-5 pt-5 sm:px-6", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Label + control + hint/error, wired together for screen readers. */
export function Field({ label, hint, error, children, className, optional }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cx("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-ink">
          {label}
          {optional && <span className="text-xs font-normal text-faint">Optional</span>}
        </label>
      )}
      {typeof children === "function" ? children({ id, describedBy, invalid: !!error }) : children}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[13px] text-faint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

const inputBase =
  // text-base on phones: iOS zooms the page when focusing an input under 16px.
  // min-w-0 lets inputs (dates especially) shrink inside flex rows on narrow screens.
  "h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-base text-ink sm:text-sm placeholder:text-faint transition-colors hover:border-line-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60";

export function Input({ className, prefix, invalid, ...props }) {
  if (prefix) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-faint">{prefix}</span>
        <input
          className={cx(inputBase, "pl-7", invalid && "border-danger", className)}
          aria-invalid={invalid || undefined}
          {...props}
        />
      </div>
    );
  }
  return <input className={cx(inputBase, invalid && "border-danger", className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(inputBase, "appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9", className)} style={{ backgroundImage: CHEVRON }} {...props}>
      {children}
    </select>
  );
}
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const badgeTones = {
  neutral: "bg-subtle text-muted",
  accent: "bg-accent-soft text-accent-ink",
  danger: "bg-danger-soft text-danger",
  warn: "bg-warn-soft text-warn",
};
export function Badge({ tone = "neutral", children, className }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

export function Spinner({ className = "size-5" }) {
  return <Loader2 className={cx("animate-spin text-faint", className)} aria-label="Loading" />;
}

export function Skeleton({ className }) {
  return <div className={cx("animate-pulse rounded-lg bg-subtle", className)} />;
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-12 text-center", className)}>
      {Icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-subtle">
          <Icon className="size-5 text-muted" aria-hidden />
        </div>
      )}
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const alertTones = {
  danger: { cls: "bg-danger-soft text-danger", Icon: AlertCircle },
  info: { cls: "bg-subtle text-muted", Icon: Info },
  success: { cls: "bg-accent-soft text-accent-ink", Icon: CheckCircle2 },
  warn: { cls: "bg-warn-soft text-warn", Icon: AlertCircle },
};
export function Alert({ tone = "danger", children, className }) {
  const { cls, Icon } = alertTones[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm", cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** A row of options where exactly one is selected (tabs, theme picker, filters). */
export function Segmented({ options, value, onChange, className, size = "md" }) {
  return (
    <div role="tablist" className={cx("inline-flex max-w-full overflow-x-auto rounded-lg border border-line bg-subtle p-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors",
              // Taller on touch screens (phones, tablets) so they are easy to tap
              size === "sm" ? "h-7 px-2.5 text-xs pointer-coarse:h-8" : "h-8 px-3 text-sm pointer-coarse:h-9",
              active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
            )}
          >
            {o.icon && <o.icon className="size-3.5" aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stat({ label, value, hint, className }) {
  return (
    <div className={className}>
      <p className="text-[13px] text-muted">{label}</p>
      <p className="tabular mt-1 whitespace-nowrap text-lg font-semibold tracking-tight text-ink sm:text-xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the first field (or the panel) when the dialog opens
    const first = panel.current?.querySelector("input, select, textarea, button:not([data-close])");
    (first || panel.current)?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  // Rendered into <body> so a parent with a transform/animation can't pull the
  // "fixed" overlay out of the viewport.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cx(
          "fade-in relative flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-xl outline-none sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl",
          size === "sm" ? "sm:max-w-sm" : "sm:max-w-md"
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button data-close onClick={onClose} className="-mr-2 rounded-md p-1.5 text-faint pointer-coarse:p-2 hover:bg-subtle hover:text-ink" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Two-line key/value row used in receipts and detail panels. */
export function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="min-w-0 break-all text-right font-medium text-ink">{children}</span>
    </div>
  );
}
