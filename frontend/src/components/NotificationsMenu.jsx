import { useEffect, useRef, useState } from "react";
import { Bell, ArrowDownLeft, ArrowUpRight, ShieldAlert, Wallet, Info, CheckCheck } from "lucide-react";
import { notificationAPI } from "../lib/api";
import { cx, relativeTime } from "../lib/format";
import { Spinner } from "./ui";

const KIND_ICON = {
  CREDIT: ArrowDownLeft,
  DEBIT: ArrowUpRight,
  SECURITY: ShieldAlert,
  ACCOUNT: Wallet,
  INFO: Info,
};

/** Bell button with an unread dot; opens a panel listing recent notifications. */
export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [unread, setUnread] = useState(0);
  const root = useRef(null);

  // Poll the unread count so new payments show up without a reload
  useEffect(() => {
    let alive = true;
    const tick = () =>
      notificationAPI
        .unreadCount()
        .then((r) => alive && setUnread(r.count))
        .catch(() => {});
    tick();
    const t = setInterval(tick, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    notificationAPI.list().then(setItems).catch(() => setItems([]));
    const onClick = (e) => !root.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markAll = async () => {
    await notificationAPI.markAllRead().catch(() => {});
    setItems((list) => list?.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const markOne = (n) => {
    if (n.read) return;
    notificationAPI.markRead(n.id).catch(() => {});
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnread((c) => Math.max(0, c - 1));
  };

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fade-in absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-black/5">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline">
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items === null ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted">You're all caught up.</p>
            ) : (
              items.map((n) => {
                const Icon = KIND_ICON[n.kind] || Info;
                return (
                  <button
                    key={n.id}
                    onClick={() => markOne(n)}
                    className={cx(
                      "flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-subtle",
                      !n.read && "bg-accent-soft/40"
                    )}
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-subtle">
                      <Icon className="size-3.5 text-muted" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={cx("text-sm text-ink", !n.read && "font-medium")}>{n.title}</span>
                        {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                      </span>
                      {n.message && <span className="mt-0.5 block truncate text-xs text-muted">{n.message}</span>}
                      <span className="mt-1 block text-[11px] text-faint">{relativeTime(n.createdAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
