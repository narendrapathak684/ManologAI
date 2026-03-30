import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpenText,
  CalendarDays,
  ChartColumnBig,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  Save,
  User,
  X,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSaveAlert } from "../context/SaveAlertContext";
import { api, getApiErrorMessage } from "../lib/api";

const navItems = [
  { label: "Today", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Journal", icon: BookOpenText, to: "/journal", active: true },
  { label: "Track", icon: CheckCircle2, to: "/track" },
  { label: "Analytics", icon: ChartColumnBig, to: "/analytics" },
  { label: "Organise", icon: FolderKanban, to: "/organise" },
];

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

function formatDateLabel(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getPreviousDates(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return formatDateKey(date);
  });
}

export default function JournalPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const { showSaveAlert, clearSaveAlert } = useSaveAlert();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const quickDates = useMemo(() => getPreviousDates(7), []);

  useEffect(() => {
    let ignore = false;

    const loadEntry = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(`/diary/api/diary/${selectedDate}`);

        if (!ignore) {
          setDraft(data.entry?.text || "");
          setSavedAt("");
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          if (!ignore) {
            setDraft("");
            setSavedAt("");
          }
          return;
        }

        const message =
          err?.response?.status === 401
            ? "Your session expired. Please log in again."
            : getApiErrorMessage(err, "Failed to load diary entry.");

        if (!ignore) {
          setDraft("");
          setError(message);
          if (String(message).toLowerCase().includes("log in again")) {
            navigate("/login");
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadEntry();

    return () => {
      ignore = true;
    };
  }, [selectedDate]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    clearSaveAlert();

    try {
      const { data } = await api.post("/diary/api/diary", {
        date: selectedDate,
        text: draft,
      });

      setDraft(data.entry?.text || "");
      setSavedAt(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      );
      showSaveAlert({
        title: "Daily Matrix",
        message: "Your note was saved successfully.",
      });
    } catch (err) {
      const message =
        err?.response?.status === 401
          ? "Your session expired. Please log in again."
          : getApiErrorMessage(err, "Failed to save diary entry.");
      setError(message);
      if (String(message).toLowerCase().includes("log in again")) {
        navigate("/login");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute left-[-10%] top-8 h-80 w-80 rounded-full bg-pink-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-8%] top-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-[150px]" />

      <div className="relative z-10 flex min-h-screen">
        <motion.aside
          initial={false}
          animate={{ 
            width: isSidebarOpen ? 288 : 88,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="hidden shrink-0 border-r border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl lg:flex lg:flex-col relative group"
        >
          <div className={`flex items-center gap-3 mb-10 overflow-hidden ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
            {isSidebarOpen && (
              <div className="flex items-center gap-3 shrink-0">
                 <Link to="/profile" className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-white/5 text-slate-400 hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-white transition-all">
                    <User className="h-5 w-5" />
                 </Link>
                 <motion.div
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -10 }}
                   className="whitespace-nowrap"
                 >
                   <p className="text-lg font-semibold text-white truncate max-w-[140px]">
                     {user?.firstName || "ManologAI"}
                   </p>
                   <p className="text-sm text-slate-400">Journal hub</p>
                 </motion.div>
              </div>
            )}
            
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all ${isSidebarOpen ? "-mr-2" : ""}`}
            >
              {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          <nav className="space-y-2 overflow-hidden">
            {navItems.map(({ label, icon: Icon, to, active }) => (
              <Button
                key={label}
                asChild
                variant="ghost"
                className={`h-auto w-full justify-start rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                  active
                    ? "border-pink-500/30 bg-pink-500/10 text-white"
                    : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Link to={to} className="flex items-center">
                  <Icon className={`mr-3 h-4 w-4 shrink-0 ${active ? "text-pink-300" : ""}`} />
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </Link>
              </Button>
            ))}
          </nav>

          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-auto"
            >
              <Card className="mt-auto border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle className="text-sm text-white">Writing cue</CardTitle>
                  <CardDescription className="text-xs">
                    Try describing one truth from the day without polishing it.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          )}
        </motion.aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <p className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-pink-300">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Journal
                  </p>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                      Write for the day you actually had.
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                      Jump across recent dates, open any custom day, and keep one
                      note saved for each date.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="border-white/10 bg-white/5 text-slate-200"
                  />
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-pink-600 text-white hover:bg-pink-500"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save note"}
                  </Button>
                </div>
              </div>
            </motion.section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[280px_1fr]">
              <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Jump to date</CardTitle>
                  <CardDescription>
                    Open one of the last seven days or choose your own.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickDates.map((dateKey) => {
                    const isActive = dateKey === selectedDate;
                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => setSelectedDate(dateKey)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                          isActive
                            ? "border-pink-500/30 bg-pink-500/10 text-white"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {dateKey === formatDateKey(new Date())
                            ? "Today"
                            : formatDateLabel(dateKey)}
                        </span>
                        <span className="text-xs text-slate-500">{dateKey}</span>
                      </button>
                    );
                  })}

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                      Custom date
                    </p>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="border-white/10 bg-black/20 text-slate-200"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-white">
                        {formatDateLabel(selectedDate)}
                      </CardTitle>
                      <CardDescription>
                        Your note for {selectedDate}
                      </CardDescription>
                    </div>
                    {savedAt ? (
                      <span className="text-sm text-emerald-400">
                        Saved at {savedAt}
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  {error ? (
                    <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                      {error}
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Write freely about what happened, what you felt, what you learned, and what you want to carry forward."
                      disabled={loading}
                      className="min-h-[520px] w-full resize-none bg-transparent text-base leading-8 text-slate-200 outline-none placeholder:text-slate-500"
                    />
                  </div>
                  {loading ? (
                    <p className="mt-3 text-sm text-slate-500">
                      Loading entry for {selectedDate}...
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
