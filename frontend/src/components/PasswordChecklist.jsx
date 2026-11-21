import { Check } from "lucide-react";
import { cx } from "../lib/format";

// Same rules the backend enforces (RegisterRequest / ChangePasswordRequest)
const RULES = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Upper & lowercase", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
  { label: "A symbol (@#$%^&+=)", test: (p) => /[@#$%^&+=]/.test(p) },
];

// eslint-disable-next-line react-refresh/only-export-components
export const passwordOk = (p) => RULES.every((r) => r.test(p));

export default function PasswordChecklist({ password }) {
  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
      {RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.label} className={cx("flex items-center gap-1.5 text-xs", ok ? "text-accent-ink" : "text-faint")}>
            <Check className={cx("size-3", !ok && "opacity-30")} aria-hidden />
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}
