import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Tags,
  Plus,
  X,
} from "lucide-react";

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
import { useTheme } from "../context/ThemeContext";
import { api, getApiErrorMessage } from "../lib/api";

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
    lightAccent: "#be185d",
    bg: "rgba(244, 114, 182, 0.16)",
    border: "rgba(244, 114, 182, 0.34)",
  },
  {
    accent: "#fb923c",
    lightAccent: "#c2410c",
    bg: "rgba(251, 146, 60, 0.16)",
    border: "rgba(251, 146, 60, 0.34)",
  },
  {
    accent: "#facc15",
    lightAccent: "#a16207",
    bg: "rgba(250, 204, 21, 0.16)",
    border: "rgba(250, 204, 21, 0.34)",
  },
  {
    accent: "#4ade80",
    lightAccent: "#047857",
    bg: "rgba(74, 222, 128, 0.16)",
    border: "rgba(74, 222, 128, 0.34)",
  },
  {
    accent: "#22d3ee",
    lightAccent: "#0e7490",
    bg: "rgba(34, 211, 238, 0.16)",
    border: "rgba(34, 211, 238, 0.34)",
  },
  {
    accent: "#60a5fa",
    lightAccent: "#1d4ed8",
    bg: "rgba(96, 165, 250, 0.16)",
    border: "rgba(96, 165, 250, 0.34)",
  },
  {
    accent: "#c084fc",
    lightAccent: "#7e22ce",
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
  const { showSaveAlert, clearSaveAlert } = useSaveAlert();
  const { theme } = useTheme();
  const isLightMode = theme === "light";
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const quickDates = useMemo(() => getPreviousDates(7), []);
  const selectedDateColor = useMemo(
    () => getDateColor(selectedDate, quickDates),
    [quickDates, selectedDate],
  );
  const selectedDateSurface = isLightMode
    ? selectedDateColor.bg.replace("0.16", "0.12")
    : selectedDateColor.bg;

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
        const { data } = await api.get(`/diary/${selectedDate}`);

        if (!ignore) {
          setDraft(data.entry?.text || "");
          setTags(data.entry?.tags || []);
          setSavedAt("");
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          if (!ignore) {
            setDraft("");
            setTags([]);
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
          setTags([]);
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
      const { data } = await api.post("/diary", {
        date: selectedDate,
        text: draft,
        tags: tags,
      });

      setDraft(data.entry?.text || "");
      setTags(data.entry?.tags || []);
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

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    if (tags.includes(tagInput.trim().toLowerCase())) {
      setTagInput("");
      return;
    }
    setTags([...tags, tagInput.trim().toLowerCase()]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  return (
    <div className="h-screen overflow-hidden bg-black text-slate-100 relative">
      <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none">
        <div className="absolute left-[-10%] top-8 h-80 w-80 rounded-full bg-pink-600/10 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/20 blur-[120px] rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 h-full">
        <main className="h-full overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-[28px] border p-6 shadow-2xl backdrop-blur-xl sm:p-8"
              style={{
                borderColor: selectedDateColor.border,
                backgroundImage: isLightMode
                  ? `linear-gradient(160deg, ${selectedDateSurface}, rgba(255, 255, 255, 0.94))`
                  : `linear-gradient(160deg, ${selectedDateColor.bg}, rgba(15, 23, 42, 0.72))`,
                boxShadow: isLightMode
                  ? `0 18px 50px -34px ${selectedDateColor.accent}, 0 0 0 1px ${selectedDateColor.border} inset`
                  : `0 0 0 1px ${selectedDateColor.border} inset`,
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
              <Card
                className="border-white/10 bg-slate-900/50 backdrop-blur-xl"
                style={
                  isLightMode
                    ? {
                        backgroundColor: "rgba(255, 255, 255, 0.96)",
                        borderColor: "rgba(15, 23, 42, 0.1)",
                        boxShadow: "0 18px 48px -36px rgba(15, 23, 42, 0.35)",
                      }
                    : undefined
                }
              >
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
                              : isLightMode
                                ? "rgba(15, 23, 42, 0.12)"
                                : "rgba(255, 255, 255, 0.10)",
                            backgroundColor: isActive
                              ? dateColor.bg
                              : isLightMode
                                ? "rgba(255, 255, 255, 0.78)"
                                : undefined,
                          }}
                        >
                          <span
                            className="shrink-0 whitespace-nowrap text-sm font-medium"
                            style={{
                              color: isActive
                                ? isLightMode
                                  ? dateColor.lightAccent
                                  : dateColor.accent
                                : isLightMode
                                  ? dateColor.lightAccent
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
                                  ? isLightMode
                                    ? dateColor.lightAccent
                                    : dateColor.accent
                                  : isLightMode
                                    ? dateColor.lightAccent
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
                  backgroundColor: isLightMode
                    ? "rgba(255, 255, 255, 0.9)"
                    : "rgba(15, 23, 42, 0.5)",
                  boxShadow: isLightMode
                    ? `0 18px 54px -36px ${selectedDateColor.accent}, 0 0 0 1px ${selectedDateColor.border} inset`
                    : `0 0 0 1px ${selectedDateColor.border} inset`,
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
                      backgroundImage: isLightMode
                        ? `linear-gradient(180deg, ${selectedDateSurface}, rgba(255,255,255,0.88))`
                        : `linear-gradient(180deg, ${selectedDateColor.bg}, rgba(255,255,255,0.02))`,
                      boxShadow: isLightMode
                        ? `0 16px 42px -34px ${selectedDateColor.accent}`
                        : `0 18px 40px -28px ${selectedDateColor.accent}`,
                    }}
                  >
                      <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="Write freely about what happened, what you felt, what you learned, and what you want to carry forward."
                        disabled={loading}
                        className="min-h-[460px] w-full resize-none bg-transparent text-base leading-8 text-slate-200 outline-none placeholder:text-slate-500"
                      />

                      <div className="mt-4 border-t border-white/5 pt-4">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="group flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300 border border-white/5"
                            >
                              #{tag}
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {tags.length === 0 && (
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <Tags className="h-3 w-3" /> No tags added
                            </p>
                          )}
                        </div>
                        <form
                          onSubmit={handleAddTag}
                          className="flex items-center gap-2 max-w-xs"
                        >
                          <div className="relative flex-1">
                            <Plus className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                            <input
                              type="text"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              placeholder="Add tag..."
                              className="w-full rounded-lg bg-black/40 border border-white/10 px-8 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                            />
                          </div>
                          <Button
                            type="submit"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-lg hover:bg-pink-500/10 text-slate-400 hover:text-pink-400"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
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
