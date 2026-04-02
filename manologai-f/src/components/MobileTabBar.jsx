import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";

export default function MobileTabBar({ items }) {
  const location = useLocation();

  const content = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 lg:hidden">
      <nav className="pointer-events-auto mx-auto flex max-w-xl items-center justify-between rounded-[28px] border border-white/10 bg-slate-900/90 px-3 py-2 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
        {items.map(({ label, icon, to }) => {
          const Icon = icon;
          const isActive = location.pathname === to;

          return (
            <Link
              key={label}
              to={to}
              aria-label={label}
              className={`flex min-w-0 flex-1 items-center justify-center rounded-2xl px-2 py-3 transition-all ${
                isActive
                  ? "bg-pink-500/15 text-pink-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span className="relative flex items-center justify-center">
                <Icon className="h-5 w-5" />
                {isActive && (
                  <span className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-pink-300" />
                )}
              </span>
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(content, document.body);
}
