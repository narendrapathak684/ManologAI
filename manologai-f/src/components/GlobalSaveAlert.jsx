import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useSaveAlert } from "../context/SaveAlertContext";

export default function GlobalSaveAlert() {
  const { alert } = useSaveAlert();

  if (!alert) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-none fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-emerald-400/30 bg-slate-900/90 p-4 text-emerald-100 shadow-[0_24px_80px_-32px_rgba(16,185,129,0.65)] backdrop-blur-2xl"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-emerald-500/15 p-2 text-emerald-300">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-400/90">
            {alert.title}
          </p>
          <p className="mt-1 text-sm font-medium leading-6 text-emerald-50">
            {alert.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
