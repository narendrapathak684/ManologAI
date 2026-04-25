import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import GlobalSaveAlert from "./GlobalSaveAlert";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  BellRing,
  Bell,
  BookOpenText,
  ChartColumnBig,
  CheckCircle2,
  CircleCheckBig,
  FolderKanban,
  LayoutDashboard,
  Sparkles,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";

const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) {
    return "";
  }

  if (typeof profilePicture === "string") {
    return profilePicture;
  }

  return profilePicture.url || "";
};

export default function AppNavbar() {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const profilePictureUrl = getProfilePictureUrl(user?.profilePicture);
  const navItems = [
    { label: "Today", to: "/dashboard", icon: LayoutDashboard },
    { label: "Journal", to: "/journal", icon: BookOpenText },
    { label: "Track", to: "/track", icon: CheckCircle2 },
    { label: "Analytics", to: "/analytics", icon: ChartColumnBig },
    { label: "Organise", to: "/organise", icon: FolderKanban },
  ];

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("touchstart", handleDocumentClick);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("touchstart", handleDocumentClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="relative">
        <GlobalSaveAlert />
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 shadow-[0_0_30px_-14px_rgba(56,189,248,0.6)]">
              <img
                src="/logo.png"
                alt="ManologAI"
                className="h-6 w-6 object-contain"
              />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold text-white">Manolog</p>
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
                  className={`flex items-center gap-2 rounded-2xl border border-transparent px-3 py-2 transition-all ${
                    isActive
                      ? "bg-pink-500/15 text-white shadow-[0_0_16px_0_rgba(236,72,153,0.45)] border-pink-400/30"
                      : "text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {isActive && (
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
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-pink-400/40 hover:bg-pink-400/10 hover:text-white hover:shadow-[0_0_16px_0_rgba(236,72,153,0.45)]"
              aria-label={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
              title={
                theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className={`relative flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 transition hover:border-pink-400/40 hover:bg-pink-400/10 hover:text-white hover:shadow-[0_0_16px_0_rgba(236,72,153,0.45)] ${
                  isNotificationOpen
                    ? "border-pink-400/50 bg-pink-400/15 text-white shadow-[0_0_16px_0_rgba(236,72,153,0.45)]"
                    : ""
                }`}
                aria-label="Notifications"
                aria-expanded={isNotificationOpen}
                aria-haspopup="menu"
              >
                <Bell className="h-5 w-5" />
                {isNotificationOpen && (
                  <span className="text-sm font-semibold text-white">
                    Notifications
                  </span>
                )}
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400" />
              </button>

              {isNotificationOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.6rem)] z-[80] w-[min(22rem,90vw)] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.95)] backdrop-blur-2xl"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-white">
                      <BellRing className="h-4 w-4 text-pink-300" />
                      <p className="text-sm font-semibold">Notifications</p>
                    </div>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                      3 New
                    </span>
                  </div>

                  <ul className="divide-y divide-white/5">
                    <li className="flex items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 rounded-xl bg-pink-400/15 p-2 text-pink-200">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          Weekly summary is ready
                        </p>
                        <p className="text-xs text-slate-400">
                          Check your latest mood and activity trends.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 rounded-xl bg-cyan-400/15 p-2 text-cyan-200">
                        <CircleCheckBig className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          Journal saved successfully
                        </p>
                        <p className="text-xs text-slate-400">
                          Your latest entry was synced 2 minutes ago.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 px-4 py-3">
                      <span className="mt-0.5 rounded-xl bg-amber-400/15 p-2 text-amber-200">
                        <Bell className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          Friendly reminder
                        </p>
                        <p className="text-xs text-slate-400">
                          Log today&apos;s track data to keep streaks alive.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <Link
              to="/profile"
              aria-label="Profile"
              className={`group hidden h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border transition-all lg:flex ${
                location.pathname === "/profile"
                  ? "border-pink-500/50 bg-pink-500/10 shadow-[0_0_20px_-8px_rgba(236,72,153,0.5)]"
                  : "border-white/10 bg-white/5 hover:border-pink-500/40 hover:bg-pink-500/5"
              }`}
            >
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <UserRound
                  className={`h-5 w-5 transition-colors ${
                    location.pathname === "/profile"
                      ? "text-pink-300"
                      : "text-slate-400 group-hover:text-pink-300"
                  }`}
                />
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
