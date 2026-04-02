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
import MobileTabBar from "../components/MobileTabBar";

const navItems = [
  { label: "Today", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Journal", icon: BookOpenText, to: "/journal", active: true },
  { label: "Track", icon: CheckCircle2, to: "/track" },
  { label: "Analytics", icon: ChartColumnBig, to: "/analytics" },
  { label: "Organise", icon: FolderKanban, to: "/organise" },
  { label: "Profile", icon: User, to: "/profile" },
];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const today = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - index);
    return formatDateKey(date);
  }).reverse();
}

const quickDateColors = [
  {
    accent: "#f472b6",
    bg: "rgba(244, 114, 182, 0.16)",
    border: "rgba(244, 114, 182, 0.34)",
  },
  {
    accent: "#fb923c",
    bg: "rgba(251, 146, 60, 0.16)",
    border: "rgba(251, 146, 60, 0.34)",
  },
  {
    accent: "#facc15",
    bg: "rgba(250, 204, 21, 0.16)",
    border: "rgba(250, 204, 21, 0.34)",
  },
  {
    accent: "#4ade80",
    bg: "rgba(74, 222, 128, 0.16)",
    border: "rgba(74, 222, 128, 0.34)",
  },
  {
    accent: "#22d3ee",
    bg: "rgba(34, 211, 238, 0.16)",
    border: "rgba(34, 211, 238, 0.34)",
  },
  {
    accent: "#60a5fa",
    bg: "rgba(96, 165, 250, 0.16)",
    border: "rgba(96, 165, 250, 0.34)",
  },
  {
    accent: "#c084fc",
    bg: "rgba(192, 132, 252, 0.16)",
    border: "rgba(192, 132, 252, 0.34)",
  },
];

function getDateColor(dateKey, quickDates) {
  const quickDateIndex = quickDates.indexOf(dateKey);
  if (quickDateIndex >= 0) {
    return quickDateColors[quickDateIndex % quickDateColors.length];
  }

  const seed = Array.from(dateKey).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return quickDateColors[seed % quickDateColors.length];
}

export default function JournalPage() {
  const navigate = useNavigate();
  const todayDateKey = formatDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(todayDateKey);
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
  const selectedDateColor = useMemo(
    () => getDateColor(selectedDate, quickDates),
    [quickDates, selectedDate],
  );

  const handleDateChange = (nextDate) => {
    if (!nextDate) return;

    if (nextDate > todayDateKey) {
      setError("You can only write notes for today or past dates.");
      setSelectedDate(todayDateKey);
      return;
    }

    setError("");
    setSelectedDate(nextDate);
  };

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
    if (selectedDate > todayDateKey) {
      setError("You can only write notes for today or past dates.");
      return;
    }

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
        }),
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
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute left-[-10%] top-8 h-80 w-80 rounded-full bg-pink-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-8%] top-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-[150px]" />

      <div className="relative z-10 flex h-full">
        <motion.aside
          initial={false}
          animate={{
            width: isSidebarOpen ? 288 : 88,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl lg:flex lg:flex-col group"
        >
          <div
            className={`flex items-center gap-3 mb-10 overflow-hidden ${isSidebarOpen ? "justify-between" : "justify-center"}`}
          >
            {isSidebarOpen && (
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  to="/profile"
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent bg-white/5 text-slate-400 hover:border-pink-500/30 hover:bg-pink-500/10 hover:text-white transition-all"
                >
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
              {isSidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
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
                  <Icon
                    className={`mr-3 h-4 w-4 shrink-0 ${active ? "text-pink-300" : ""}`}
                  />
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
                  <CardTitle className="text-sm text-white">
                    Writing cue
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Try describing one truth from the day without polishing it.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          )}
        </motion.aside>

        <main className="flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-[28px] border p-6 shadow-2xl backdrop-blur-xl sm:p-8"
              style={{
                borderColor: selectedDateColor.border,
                backgroundImage: `linear-gradient(160deg, ${selectedDateColor.bg}, rgba(15, 23, 42, 0.72))`,
                boxShadow: `0 0 0 1px ${selectedDateColor.border} inset`,
              }}
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
                      Jump across recent dates, open any custom day, and keep
                      one note saved for each date.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    type="date"
                    value={selectedDate}
                    max={todayDateKey}
                    onChange={(event) => handleDateChange(event.target.value)}
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

            <section className="mt-6 grid gap-6">
              <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Jump to date</CardTitle>
                  <CardDescription>
                    Open one of the last seven days or choose your own.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-300">
                      {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <div className="flex flex-row flex-wrap gap-2">
                    {quickDates.map((dateKey, index) => {
                      const isActive = dateKey === selectedDate;
                      const isToday = dateKey === formatDateKey(new Date());
                      const dateColor =
                        quickDateColors[index % quickDateColors.length];
                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => setSelectedDate(dateKey)}
                          className={`flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border px-4 py-3 text-left transition-all ${
                            isActive
                              ? "text-white"
                              : "bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                          style={{
                            borderColor: isActive
                              ? dateColor.border
                              : "rgba(255, 255, 255, 0.10)",
                            backgroundColor: isActive
                              ? dateColor.bg
                              : undefined,
                          }}
                        >
                          <span
                            className="shrink-0 whitespace-nowrap text-sm font-medium"
                            style={{
                              color: isActive
                                ? dateColor.accent
                                : `${dateColor.accent}CC`,
                            }}
                          >
                            {parseInt(dateKey.split("-")[2])}
                          </span>
                          {isToday && (
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor: isActive
                                  ? dateColor.accent
                                  : `${dateColor.accent}66`,
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card
                className="backdrop-blur-xl"
                style={{
                  borderColor: selectedDateColor.border,
                  backgroundColor: "rgba(15, 23, 42, 0.5)",
                  boxShadow: `0 0 0 1px ${selectedDateColor.border} inset`,
                }}
              >
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle style={{ color: selectedDateColor.accent }}>
                        {formatDateLabel(selectedDate)}
                      </CardTitle>
                      <CardDescription
                        style={{ color: `${selectedDateColor.accent}CC` }}
                      >
                        Your note for {selectedDate}
                      </CardDescription>
                    </div>
                    {savedAt ? (
                      <span
                        className="text-sm"
                        style={{ color: selectedDateColor.accent }}
                      >
                        Saved at {savedAt}
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-300">
                      {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  {error ? (
                    <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                      {error}
                    </div>
                  ) : null}
                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      borderColor: selectedDateColor.border,
                      backgroundImage: `linear-gradient(180deg, ${selectedDateColor.bg}, rgba(255,255,255,0.02))`,
                      boxShadow: `0 18px 40px -28px ${selectedDateColor.accent}`,
                    }}
                  >
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

      <MobileTabBar items={navItems} />
    </div>
  );
}
