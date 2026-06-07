import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DISPLAY_MS = 2400;

export default function MobileLaunchScreen() {
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const params = new URLSearchParams(window.location.search);
    const forcePreview = params.has("launch-preview");

    const updateMobileState = () => {
      setIsMobile(mediaQuery.matches || forcePreview);
    };

    updateMobileState();
    mediaQuery.addEventListener("change", updateMobileState);

    return () => mediaQuery.removeEventListener("change", updateMobileState);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const params = new URLSearchParams(window.location.search);
    const forcePreview = params.has("launch-preview");

    setIsVisible(true);

    if (forcePreview) return;

    const timer = window.setTimeout(() => {
      setIsVisible(false);
    }, DISPLAY_MS);

    return () => window.clearTimeout(timer);
  }, [isMobile]);

  return (
    <AnimatePresence>
      {isMobile && isVisible ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex min-h-dvh flex-col overflow-hidden bg-[#0b1020] text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          aria-label="ManologAI launch screen"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_22%,rgba(236,72,153,0.24),transparent_34%),radial-gradient(circle_at_78%_68%,rgba(16,185,129,0.2),transparent_32%),linear-gradient(160deg,#111827_0%,#060817_68%,#090b12_100%)]" />
          <div className="absolute inset-x-10 top-16 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center">
            <motion.img
              src="/logo.png"
              alt="ManologAI"
              className="h-28 w-28 rounded-[28px] object-cover shadow-[0_24px_80px_rgba(236,72,153,0.25)]"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            <motion.div
              className="mt-7 space-y-2"
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.18, ease: "easeOut" }}
            >
              <h1 className="text-3xl font-bold tracking-normal text-white">
                ManologAI
              </h1>
              <p className="text-sm font-medium tracking-normal text-slate-300">
                Personal growth, beautifully tracked.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="relative z-10 px-8 pb-[calc(2.25rem+env(safe-area-inset-bottom))] text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.34, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold tracking-normal text-white/45">
              Made by Narendra Pathak
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
