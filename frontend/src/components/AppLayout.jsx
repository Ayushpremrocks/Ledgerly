import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Wallet,
  ArrowLeftRight,
  ReceiptText,
  Users,
  ChartColumn,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import Logo from "./Logo";
import NotificationsMenu from "./NotificationsMenu";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { cx, initials } from "../lib/format";

const NAV = [
  { to: "/overview", label: "Overview", icon: LayoutGrid },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/move", label: "Move money", icon: ArrowLeftRight },
  { to: "/activity", label: "Activity", icon: ReceiptText },
  { to: "/payees", label: "Payees", icon: Users },
  { to: "/insights", label: "Insights", icon: ChartColumn },
];

function NavItems({ onNavigate }) {
  const { isAdmin } = useAuth();
  const items = [...NAV, { to: "/settings", label: "Settings", icon: Settings }];
  if (isAdmin) items.push({ to: "/admin", label: "Admin", icon: ShieldCheck });

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              isActive ? "bg-subtle text-ink" : "text-muted hover:bg-subtle hover:text-ink"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cx("size-[18px]", isActive ? "text-accent-ink" : "text-faint")} aria-hidden />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function UserCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">
        {initials(user?.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{user?.fullName}</p>
        <p className="truncate text-xs text-faint">@{user?.username}</p>
      </div>
      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        className="rounded-md p-2 text-faint hover:bg-subtle hover:text-ink"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  const dark = resolved === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

export default function AppLayout() {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  // Close the mobile menu after navigating, and start each page at the top
  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // While the phone menu is open, the page behind it shouldn't scroll; Escape closes it
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <div className="px-3 pb-6">
          <Logo />
        </div>
        <NavItems />
        <div className="mt-auto">
          <UserCard />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawer(false)} aria-hidden />
          <aside className="fade-in absolute inset-y-0 left-0 flex w-72 flex-col bg-surface px-3 py-5 shadow-xl">
            <div className="flex items-center justify-between px-3 pb-6">
              <Logo />
              <button onClick={() => setDrawer(false)} className="rounded-md p-2 text-faint hover:bg-subtle" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setDrawer(false)} />
            <div className="mt-auto">
              <UserCard />
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-canvas/85 px-4 backdrop-blur sm:px-6 lg:px-10">
          <button
            onClick={() => setDrawer(true)}
            className="-ml-1 flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationsMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 2xl:max-w-7xl min-[2200px]:max-w-[96rem]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
