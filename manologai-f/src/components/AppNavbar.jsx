import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  BookOpenText,
  ChartColumnBig,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  UserRound,
} from "lucide-react";

export default function AppNavbar() {
  const location = useLocation();
  const [activeAction, setActiveAction] = useState(null);
  const navItems = [
    { label: "Today", to: "/dashboard", icon: LayoutDashboard },
    { label: "Journal", to: "/journal", icon: BookOpenText },
    { label: "Track", to: "/track", icon: CheckCircle2 },
    { label: "Analytics", to: "/analytics", icon: ChartColumnBig },
    { label: "Organise", to: "/organise", icon: FolderKanban },
  ];

  useEffect(() => {
    setActiveAction(location.pathname);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 shadow-[0_0_30px_-14px_rgba(56,189,248,0.6)]">
            <img
              src="/logo.png"
              alt="ManologAI"
              className="h-6 w-6 object-contain"
            />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-[0.2em] text-slate-400">
              MANOLOG
            </p>
            <p className="text-lg font-semibold text-white">ManologAI</p>
          </div>
        </Link>
        <nav className="hidden flex-1 items-center justify-end gap-2 text-sm font-medium text-slate-300 lg:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                onClick={() => setActiveAction(item.to)}
                className={`flex items-center gap-2 rounded-2xl border border-transparent px-3 py-2 transition-all ${
                  isActive
                    ? "bg-pink-500/15 text-white shadow-[0_0_16px_0_rgba(236,72,153,0.45)] border-pink-400/30"
                    : "text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Icon className="h-5 w-5" />
                {activeAction === item.to && (
                  <span className="text-sm font-semibold text-white">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveAction("notifications")}
            className={`relative flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:border-pink-400/40 hover:bg-pink-400/10 hover:text-white hover:shadow-[0_0_16px_0_rgba(236,72,153,0.45)] ${
              activeAction === "notifications"
                ? "border-pink-400/50 bg-pink-400/15 text-white shadow-[0_0_16px_0_rgba(236,72,153,0.45)]"
                : ""
            }`}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {activeAction === "notifications" && (
              <span className="text-sm font-semibold text-white">
                Notifications
              </span>
            )}
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400" />
          </button>
          <Link
            to="/profile"
            aria-label="Profile"
            onClick={() => setActiveAction("/profile")}
            className={`flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:border-pink-400/40 hover:bg-pink-400/10 hover:text-white hover:shadow-[0_0_16px_0_rgba(236,72,153,0.45)] ${
              location.pathname === "/profile"
                ? "border-pink-400/50 bg-pink-400/15 text-white shadow-[0_0_16px_0_rgba(236,72,153,0.45)]"
                : ""
            }`}
          >
            <UserRound className="h-5 w-5" />
            {activeAction === "/profile" && (
              <span className="text-sm font-semibold text-white">Profile</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
