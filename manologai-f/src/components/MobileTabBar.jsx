import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return "";
  if (typeof profilePicture === "string") return profilePicture;
  return profilePicture.url || "";
};

export default function MobileTabBar({ items }) {
  const location = useLocation();
  const { user } = useAuth();
  const profilePictureUrl = getProfilePictureUrl(user?.profilePicture);


  const filteredItems = items;

  const content =
  <div
    className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
    
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
            isActive ?
            "bg-pink-500/15 text-pink-300 shadow-[0_0_16px_0_rgba(236,72,153,0.45)] border border-pink-400/30" :
            "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`
            }>
            
              <span className="relative flex items-center justify-center">
                {label === "Profile" && profilePictureUrl ?
              <div
                className={`h-5 w-5 overflow-hidden rounded-full border ${
                isActive ? "border-pink-300" : "border-white/10"}`
                }>
                
                    <img
                  src={profilePictureUrl}
                  alt=""
                  className="h-full w-full object-cover" />
                
                  </div> :

              <Icon className="h-5 w-5" />
              }
              </span>
              <span className="text-[7px] font-semibold uppercase tracking-[0.14em]">
                {label}
              </span>
            </Link>);

      })}
      </nav>
    </div>;


  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(content, document.body);
}