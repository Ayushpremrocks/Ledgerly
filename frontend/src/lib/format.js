// Formatting helpers. Everything is INR with Indian digit grouping (1,00,000).

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const money = (n) => inr.format(Number(n || 0));
export const moneyWhole = (n) => inrWhole.format(Number(n || 0));
/** ₹1.5L, ₹20K: for chart axes */
export const moneyCompact = (n) => inrCompact.format(Number(n || 0));

/** "ACC1234567890123" -> "•••• 0123" */
export const maskAccount = (n) => (n ? `•••• ${n.slice(-4)}` : "");

/** "ACC1234567890123" -> "ACC 1234 5678 9012 3" for readability */
export const spacedAccount = (n) => (n ? n.replace(/^(ACC)(\d{4})(\d{4})(\d{4})(\d+)$/, "$1 $2 $3 $4 $5") : "");

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short" });
const monthYearFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

export const date = (d) => (d ? dateFmt.format(new Date(d)) : "");
export const time = (d) => (d ? timeFmt.format(new Date(d)) : "");
export const dateTime = (d) => (d ? `${date(d)}, ${time(d)}` : "");
/** "2026-11" -> "Nov" */
export const shortMonth = (ym) => monthFmt.format(new Date(`${ym}-01T00:00:00`));
export const longMonth = (ym) => monthYearFmt.format(new Date(`${ym}-01T00:00:00`));

/** "Today", "Yesterday" or "18 Nov 2026" */
export function dayLabel(d) {
  const day = new Date(d);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(day, today)) return "Today";
  if (same(day, y)) return "Yesterday";
  return date(d);
}

export function relativeTime(d) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return date(d);
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

/** Today's date as YYYY-MM-DD in local time (for <input type="date">) */
export function isoDay(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

/** Tiny className joiner: cx("a", cond && "b") */
export const cx = (...parts) => parts.filter(Boolean).join(" ");
