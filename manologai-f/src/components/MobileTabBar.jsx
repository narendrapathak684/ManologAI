import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

export default function MobileTabBar({ items }) {
  const location = useLocation();
  const [show, setShow] = useState(true);
  const lastScrollY = useRef(window.scrollY);
  const ticking = useRef(false);

  // Filter out Profile button if on /profile page
  const filteredItems =
    location.pathname === "/profile"
      ? items.filter((item) => item.label !== "Profile")
      : items;

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY.current + 10) {
            setShow(false); // Scroll down, hide
          } else if (currentScrollY < lastScrollY.current - 10) {
            setShow(true); // Scroll up, show
          }
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const content = (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4 lg:hidden transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{
        transform: show ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <nav className="pointer-events-auto mx-auto flex max-w-xl items-center justify-between rounded-[28px] border border-white/10 bg-slate-900/90 px-3 py-2 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
        {filteredItems.map(({ label, icon, to }) => {
          const Icon = icon;
          const isActive = location.pathname === to;

          return (
            <Link
              key={label}
              to={to}
              aria-label={label}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-all ${
                isActive
                  ? "bg-pink-500/15 text-pink-300 shadow-[0_0_16px_0_rgba(236,72,153,0.45)] border border-pink-400/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <span className="relative flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[7px] font-semibold uppercase tracking-[0.14em]">
                {label}
              </span>
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
