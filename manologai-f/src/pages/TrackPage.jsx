import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpenText,
  CalendarDays,
  ChartColumnBig,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Save,
  Zap,
  Moon,
  Monitor,
  Briefcase,
  DollarSign,
  Heart,
  Users,
  Activity,
  Wallet,
  Home,
  Palmtree,
  TrendingUp,
  Star,
  User,
  Trash2,
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
  { label: "Journal", icon: BookOpenText, to: "/journal" },
  { label: "Track", icon: CheckCircle2, to: "/track", active: true },
  { label: "Analytics", icon: ChartColumnBig, to: "/analytics" },
  { label: "Organise", icon: FolderKanban, to: "/organise" },
  { label: "Profile", icon: User, to: "/profile" },
];

const defaultLifeRatings = {
  partner: 5,
  familyFriends: 5,
  health: 5,
  finances: 5,
  career: 5,
  physicalEnvironment: 5,
  funRecreation: 5,
  personalGrowth: 5,
};

const MAX_HABIT_NAME_LENGTH = 60;
const STREAK_MILESTONES = [7, 30, 100, 365];

const emotionOptions = [
  {
    value: "happy",
    label: "Happy",
    emoji: "😄",
    accent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    idle: "border-emerald-500/20 bg-emerald-500/5 text-emerald-100/90 hover:bg-emerald-500/10",
    glow: "shadow-[0_0_24px_-14px_rgba(16,185,129,0.8)]",
  },
  {
    value: "calm",
    label: "Calm",
    emoji: "😌",
    accent: "border-sky-500/30 bg-sky-500/10 text-sky-200",
    idle: "border-sky-500/20 bg-sky-500/5 text-sky-100/90 hover:bg-sky-500/10",
    glow: "shadow-[0_0_24px_-14px_rgba(14,165,233,0.8)]",
  },
  {
    value: "neutral",
    label: "Neutral",
    emoji: "🙂",
    accent: "border-slate-500/30 bg-slate-500/10 text-slate-200",
    idle: "border-slate-500/20 bg-slate-500/5 text-slate-100/90 hover:bg-slate-500/10",
    glow: "shadow-[0_0_24px_-14px_rgba(100,116,139,0.8)]",
  },
  {
    value: "sad",
    label: "Sad",
    emoji: "😔",
    accent: "border-blue-500/30 bg-blue-500/10 text-blue-200",
    idle: "border-blue-500/20 bg-blue-500/5 text-blue-100/90 hover:bg-blue-500/10",
    glow: "shadow-[0_0_24px_-14px_rgba(59,130,246,0.8)]",
  },
  {
    value: "stressed",
    label: "Stressed",
    emoji: "😣",
    accent: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    idle: "border-amber-500/20 bg-amber-500/5 text-amber-100/90 hover:bg-amber-500/10",
    glow: "shadow-[0_0_24px_-14px_rgba(245,158,11,0.8)]",
  },
  {
    value: "angry",
    label: "Angry",
    emoji: "😠",
    accent: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    idle: "border-rose-500/20 bg-rose-500/5 text-rose-100/90 hover:bg-rose-500/10",
    glow: "shadow-[0_0_24px_-14px_rgba(244,63,94,0.8)]",
  },
  {
    value: "tired",
    label: "Tired",
    emoji: "😴",
    accent: "border-violet-500/30 bg-violet-500/10 text-violet-200",
    idle: "border-violet-500/20 bg-violet-500/5 text-violet-100/90 hover:bg-violet-500/10",
    glow: "shadow-[0_0_24px_-14px_rgba(139,92,246,0.8)]",
  },
  {
    value: "excited",
    label: "Excited",
    emoji: "🤩",
    accent: "border-pink-500/30 bg-pink-500/10 text-pink-200",
    idle: "border-pink-500/20 bg-pink-500/5 text-pink-100/90 hover:bg-pink-500/10",
    glow: "shadow-[0_0_24px_-14px_rgba(236,72,153,0.8)]",
  },
];

const lifeRatingCategories = [
  { key: "health", label: "Health", icon: Activity, color: "text-emerald-400" },
  { key: "career", label: "Career", icon: Briefcase, color: "text-blue-400" },
  { key: "finances", label: "Finances", icon: Wallet, color: "text-amber-400" },
  { key: "partner", label: "Partner", icon: Heart, color: "text-rose-400" },
  {
    key: "familyFriends",
    label: "Family & Friends",
    icon: Users,
    color: "text-indigo-400",
  },
  {
    key: "physicalEnvironment",
    label: "Environment",
    icon: Home,
    color: "text-orange-400",
  },
  {
    key: "funRecreation",
    label: "Fun",
    icon: Palmtree,
    color: "text-cyan-400",
  },
  {
    key: "personalGrowth",
    label: "Growth",
    icon: TrendingUp,
    color: "text-pink-400",
  },
];

const mapEntryToLifeRatings = (entry) => ({
  partner: entry?.ratings?.partner ?? defaultLifeRatings.partner,
  familyFriends:
    entry?.ratings?.familyFriends ?? defaultLifeRatings.familyFriends,
  health: entry?.ratings?.health ?? defaultLifeRatings.health,
  finances: entry?.ratings?.finances ?? defaultLifeRatings.finances,
  career: entry?.ratings?.career ?? defaultLifeRatings.career,
  physicalEnvironment:
    entry?.ratings?.physicalEnvironment ??
    defaultLifeRatings.physicalEnvironment,
  funRecreation:
    entry?.ratings?.funRecreation ?? defaultLifeRatings.funRecreation,
  personalGrowth:
    entry?.ratings?.personalGrowth ?? defaultLifeRatings.personalGrowth,
});

const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getRelativeDateKey = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateKey = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatShortDate = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const clampNumberInput = (value, min, max) => {
  if (value === "") return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  const clamped = Math.min(max, Math.max(min, numeric));
  return String(clamped);
};

const splitHoursAndMinutes = (value) => {
  if (!Number.isFinite(value)) {
    return { hours: "", minutes: "" };
  }
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    hours: String(hours),
    minutes: String(minutes),
  };
};

const toDecimalHours = (hoursValue, minutesValue) => {
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);
  const safeHours = Number.isFinite(hours) ? hours : 0;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  return safeHours + safeMinutes / 60;
};

const resolveTimeValue = (hoursValue, minutesValue) => {
  if (hoursValue === "" && minutesValue === "") return "";
  return toDecimalHours(hoursValue, minutesValue);
};

const getStreakMilestones = (currentStreak) =>
  STREAK_MILESTONES.filter((milestone) => currentStreak >= milestone);

export default function TrackPage() {
  const [habits, setHabits] = useState([]);
  const [metrics, setMetrics] = useState({
    sleepHours: "",
    sleepMinutes: "",
    screenHours: "",
    screenMinutes: "",
    workStudyHours: "",
    workStudyMinutes: "",
    expense: "",
  });
  const [metricsSubmitted, setMetricsSubmitted] = useState(false);
  const [lifeRatings, setLifeRatings] = useState(defaultLifeRatings);
  const [lifeRatingsLocked, setLifeRatingsLocked] = useState(false);
  const [lifeRatingsLoaded, setLifeRatingsLoaded] = useState(false);
  const [lifeRatingsSubmitted, setLifeRatingsSubmitted] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState("neutral");
  const [emotionLocked, setEmotionLocked] = useState(false);
  const [emotionLoaded, setEmotionLoaded] = useState(false);
  const [emotionSubmitted, setEmotionSubmitted] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingHabit, setAddingHabit] = useState(false);
  const [habitActionId, setHabitActionId] = useState(null);
  const [deletingHabitId, setDeletingHabitId] = useState(null);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [savingLifeRatings, setSavingLifeRatings] = useState(false);
  const [savingEmotion, setSavingEmotion] = useState(false);
  const [error, setError] = useState("");
  const { showSaveAlert, clearSaveAlert } = useSaveAlert();

  const today = getLocalDateKey();
  const [selectedDateKey, setSelectedDateKey] = useState(today);
  const yesterdayKey = getRelativeDateKey(1);
  const twoDaysAgoKey = getRelativeDateKey(2);
  const dateOptions = [
    { key: today, label: "Today", short: formatShortDate(today) },
    {
      key: yesterdayKey,
      label: "Yesterday",
      short: formatShortDate(yesterdayKey),
    },
    {
      key: twoDaysAgoKey,
      label: "2 Days Ago",
      short: formatShortDate(twoDaysAgoKey),
    },
  ];
  const selectedDateLabel =
    selectedDateKey === today ? "Today" : formatShortDate(selectedDateKey);
  const dateBadge = (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">
      {selectedDateLabel}
    </span>
  );
  const { user } = useAuth();
  const expenseCurrency = user?.currency || "USD";
  const expenseSymbol = (() => {
    try {
      const parts = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: expenseCurrency,
        currencyDisplay: "narrowSymbol",
      }).formatToParts(0);
      const symbolPart = parts.find((part) => part.type === "currency");
      return symbolPart?.value || expenseCurrency;
    } catch (err) {
      return expenseCurrency;
    }
  })();
  useEffect(() => {
    refreshHabits();
  }, []);

  useEffect(() => {
    fetchDailyData(selectedDateKey);
  }, [selectedDateKey]);

  const refreshHabits = async () => {
    const { data: habitsData } = await api.get("/habits");
    setHabits(habitsData?.habits || []);
  };

  const fetchDailyData = async (dateKey) => {
    setLoading(true);
    try {
      setError("");
      setLifeRatingsLoaded(false);
      setEmotionLoaded(false);
      setLifeRatingsLocked(false);
      setEmotionLocked(false);
      setLifeRatingsSubmitted(false);
      setEmotionSubmitted(false);
      setMetricsSubmitted(false);

      const isToday = dateKey === today;

      // Fetch metrics for selected day
      try {
        const { data: metricsData } = isToday
          ? await api.get("/time-tracker/today")
          : await api.get(`/time-tracker/${dateKey}`);
        const sleepParts = splitHoursAndMinutes(metricsData.entry.sleep);
        const screenParts = splitHoursAndMinutes(metricsData.entry.screen);
        const workStudyParts = splitHoursAndMinutes(
          metricsData.entry.workStudy,
        );
        setMetrics({
          sleepHours: sleepParts.hours,
          sleepMinutes: sleepParts.minutes,
          screenHours: screenParts.hours,
          screenMinutes: screenParts.minutes,
          workStudyHours: workStudyParts.hours,
          workStudyMinutes: workStudyParts.minutes,
          expense: metricsData.entry.expense || "",
        });
        setMetricsSubmitted(Boolean(metricsData?.alreadySubmitted ?? true));
      } catch (err) {
        if (err?.response?.status === 404) {
          setMetrics({
            sleepHours: "",
            sleepMinutes: "",
            screenHours: "",
            screenMinutes: "",
            workStudyHours: "",
            workStudyMinutes: "",
            expense: "",
          });
          setMetricsSubmitted(false);
        } else {
          throw err;
        }
      }

      // Fetch life ratings for selected day
      try {
        const { data: lifeRatingsData } = await api.get("/life-ratings/day", {
          params: isToday ? {} : { date: dateKey },
        });
        if (lifeRatingsData.entry) {
          setLifeRatings(mapEntryToLifeRatings(lifeRatingsData.entry));
          setLifeRatingsLocked(Boolean(lifeRatingsData.locked));
          setLifeRatingsLoaded(true);
          setLifeRatingsSubmitted(
            Boolean(lifeRatingsData?.alreadySubmitted ?? true),
          );
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setLifeRatings(defaultLifeRatings);
          setLifeRatingsLocked(false);
          setLifeRatingsLoaded(true);
          setLifeRatingsSubmitted(false);
        } else {
          throw err;
        }
      }

      // Fetch emotion for selected day
      try {
        const { data: emotionData } = isToday
          ? await api.get("/emotions/today")
          : await api.get(`/emotions/${dateKey}`);
        setSelectedEmotion(emotionData?.emotion || "neutral");
        setEmotionLocked(Boolean(emotionData?.locked));
        setEmotionLoaded(true);
        setEmotionSubmitted(
          Boolean(emotionData?.alreadySubmitted ?? emotionData?.emotion),
        );
      } catch (err) {
        if (err?.response?.status === 404) {
          setSelectedEmotion("neutral");
          setEmotionLocked(false);
          setEmotionLoaded(true);
          setEmotionSubmitted(false);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error("Failed to fetch tracking data:", err);
      setError(
        getApiErrorMessage(
          err,
          "Failed to load tracking data. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habitId, isCompleted) => {
    setHabitActionId(habitId);
    setError("");
    clearSaveAlert();
    try {
      if (isCompleted) {
        await api.delete(`/habits/${habitId}/check/${selectedDateKey}`);
      } else {
        await api.post(`/habits/${habitId}/check/${selectedDateKey}`);
      }

      await refreshHabits();
      showSaveAlert({
        title: "Daily Habits",
        message: isCompleted
          ? `Habit completion was removed for ${selectedDateLabel}.`
          : `Habit marked complete for ${selectedDateLabel}.`,
      });
    } catch (err) {
      console.error("Failed to toggle habit:", err);
      setError(getApiErrorMessage(err, "Failed to update habit."));
    } finally {
      setHabitActionId(null);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    const trimmedName = newHabitName.trim();
    if (!trimmedName) return;
    if (trimmedName.length > MAX_HABIT_NAME_LENGTH) {
      setError(
        `Habit name must be ${MAX_HABIT_NAME_LENGTH} characters or fewer.`,
      );
      return;
    }

    setAddingHabit(true);
    setError("");
    clearSaveAlert();
    try {
      const { data } = await api.post("/habits", {
        name: trimmedName,
        frequency: "daily",
      });

      if (data?.habit) {
        setHabits((current) => [...current, data.habit]);
      }
      setNewHabitName("");
      showSaveAlert({
        title: "Daily Habits",
        message: `"${data.habit?.name || "Habit"}" was added successfully.`,
      });
    } catch (err) {
      console.error("Failed to add habit:", err);
      setError(getApiErrorMessage(err, "Failed to add habit."));
    } finally {
      setAddingHabit(false);
    }
  };

  const handleDeleteHabit = async (habitId, habitName) => {
    if (!habitId || deletingHabitId) return;
    const confirmed = window.confirm(
      `Delete "${habitName || "this habit"}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingHabitId(habitId);
    setError("");
    clearSaveAlert();
    try {
      await api.delete(`/habits/${habitId}`);
      setHabits((current) => current.filter((habit) => habit._id !== habitId));
      showSaveAlert({
        title: "Daily Habits",
        message: "Habit deleted successfully.",
      });
    } catch (err) {
      console.error("Failed to delete habit:", err);
      setError(getApiErrorMessage(err, "Failed to delete habit."));
    } finally {
      setDeletingHabitId(null);
    }
  };

  const handleSaveMetrics = async () => {
    clearSaveAlert();
    setError("");

    const sleepHours = toDecimalHours(
      metrics.sleepHours || 0,
      metrics.sleepMinutes || 0,
    );
    const screenHours = toDecimalHours(
      metrics.screenHours || 0,
      metrics.screenMinutes || 0,
    );
    const workStudyHours = toDecimalHours(
      metrics.workStudyHours || 0,
      metrics.workStudyMinutes || 0,
    );
    const totalHours = sleepHours + screenHours + workStudyHours;

    if (totalHours > 24) {
      setError("Sleep + Screen + Work/Study cannot exceed 24 hours.");
      return;
    }

    setSavingMetrics(true);
    try {
      const payload = {
        sleep: resolveTimeValue(metrics.sleepHours, metrics.sleepMinutes),
        screen: resolveTimeValue(metrics.screenHours, metrics.screenMinutes),
        workStudy: resolveTimeValue(
          metrics.workStudyHours,
          metrics.workStudyMinutes,
        ),
        expense: metrics.expense,
      };
      const { data } =
        selectedDateKey === today
          ? await api.post("/time-tracker", payload)
          : await api.post(`/time-tracker/${selectedDateKey}`, payload);
      setMetricsSubmitted(Boolean(data?.alreadySubmitted ?? true));
      showSaveAlert({
        title: "Daily Metrics",
        message: `Metrics for ${selectedDateLabel} were saved successfully.`,
      });
    } catch (err) {
      console.error("Failed to save metrics:", err);
      setError(getApiErrorMessage(err, "Failed to save metrics."));
    } finally {
      setSavingMetrics(false);
    }
  };

  const handleSaveLifeRatings = async () => {
    if (lifeRatingsLocked) return;

    setSavingLifeRatings(true);
    clearSaveAlert();
    setError("");
    try {
      const endpoint =
        selectedDateKey === today
          ? "/life-ratings"
          : `/life-ratings/${selectedDateKey}`;
      const { data } = await api.post(endpoint, lifeRatings);
      if (data.entry) {
        setLifeRatings(mapEntryToLifeRatings(data.entry));
      }
      setLifeRatingsLocked(Boolean(data.locked));
      setLifeRatingsLoaded(true);
      setLifeRatingsSubmitted(Boolean(data?.alreadySubmitted ?? true));

      showSaveAlert({
        title: "Life Ratings",
        message: `Life ratings for ${selectedDateLabel} were saved successfully.`,
      });
    } catch (err) {
      console.error("Failed to save life ratings:", err);
      setError(getApiErrorMessage(err, "Failed to save life ratings"));
    } finally {
      setSavingLifeRatings(false);
    }
  };

  const handleSaveEmotion = async () => {
    if (emotionLocked) return;

    setSavingEmotion(true);
    clearSaveAlert();
    setError("");
    try {
      const endpoint =
        selectedDateKey === today
          ? "/emotions"
          : `/emotions/${selectedDateKey}`;
      const { data } = await api.post(endpoint, {
        emotion: selectedEmotion,
      });
      setSelectedEmotion(data?.emotion || selectedEmotion);
      setEmotionLocked(Boolean(data?.locked));
      setEmotionLoaded(true);
      setEmotionSubmitted(Boolean(data?.alreadySubmitted ?? true));

      showSaveAlert({
        title: "Daily Emotion",
        message: `Emotion for ${selectedDateLabel} was saved successfully.`,
      });
    } catch (err) {
      console.error("Failed to save emotion:", err);
      setError(getApiErrorMessage(err, "Failed to save emotion."));
    } finally {
      setSavingEmotion(false);
    }
  };

  const isHabitDoneOnDate = (habit, dateKey) => {
    if (!habit || !habit.history || !Array.isArray(habit.history)) return false;
    return habit.history.some((h) => {
      if (!h?.date || !h.completed) return false;
      const parsed = new Date(h.date);
      if (Number.isNaN(parsed.getTime())) return false;
      return toDateKey(parsed) === dateKey;
    });
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
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                  <p className="inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-pink-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Tracking
                  </p>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                      Measure what matters.
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                      Log your habits and daily metrics to see your progress and
                      identify patterns in your behavior over time.
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {dateOptions.map((option) => {
                      const isActive = option.key === selectedDateKey;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setSelectedDateKey(option.key)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                            isActive
                              ? "border-pink-400/60 bg-pink-500/20 text-pink-100"
                              : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {option.label}
                          <span className="ml-1 text-[10px] text-slate-400">
                            {option.short}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500">
                    Tracking for {selectedDateLabel}.
                  </p>
                </div>
              </div>
            </motion.section>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}

            <div className="mt-6 grid items-stretch gap-6 xl:grid-cols-3">
              {/* Habits Section */}
              <Card className="flex h-full flex-col border-pink-500/25 bg-gradient-to-br from-pink-500/6 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-pink-400" />
                      Daily Habits
                    </CardTitle>
                    {dateBadge}
                  </div>
                  <CardDescription>
                    Small wins every day lead to big results.
                  </CardDescription>
                  <p className="text-xs text-slate-500">
                    New habits are created through the backend `POST /habits`
                    route and refreshed from your saved list.
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-4">
                  <form
                    onSubmit={handleAddHabit}
                    className="mb-6 flex flex-col gap-2 sm:flex-row"
                  >
                    <Input
                      placeholder="New habit name..."
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      maxLength={MAX_HABIT_NAME_LENGTH}
                      disabled={addingHabit}
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-pink-500"
                    />
                    <Button
                      type="submit"
                      disabled={addingHabit}
                      className="bg-pink-600 hover:bg-pink-500 text-white shrink-0 sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {addingHabit ? "Adding..." : "Add"}
                    </Button>
                  </form>

                  {loading ? (
                    <p className="text-slate-500 text-sm italic">
                      Loading habits...
                    </p>
                  ) : habits.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">
                      No habits added yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
                        {habits.map((habit) => {
                          const done = isHabitDoneOnDate(
                            habit,
                            selectedDateKey,
                          );
                          const earnedMilestones = getStreakMilestones(
                            habit.currentStreak,
                          );
                          return (
                            <div
                              key={habit._id}
                              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-start sm:justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="overflow-x-auto pr-2">
                                  <p className="font-medium text-slate-200 whitespace-nowrap">
                                    {habit.name}
                                  </p>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  Streak:{" "}
                                  <span className="text-pink-400">
                                    {habit.currentStreak} days
                                  </span>{" "}
                                  (Best: {habit.longestStreak})
                                </p>
                                {earnedMilestones.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {earnedMilestones.map((milestone) => (
                                      <span
                                        key={milestone}
                                        className="inline-flex items-center rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-200"
                                      >
                                        {milestone}d badge
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                                <Button
                                  onClick={() =>
                                    handleToggleHabit(habit._id, done)
                                  }
                                  disabled={habitActionId === habit._id}
                                  variant={done ? "default" : "outline"}
                                  className={
                                    done
                                      ? "w-full border border-pink-500/30 bg-pink-500/20 text-pink-100 hover:bg-pink-500/30 sm:w-auto"
                                      : "w-full border border-pink-500/20 bg-pink-500/10 text-pink-100 hover:bg-pink-500/20 sm:w-auto"
                                  }
                                >
                                  {habitActionId === habit._id
                                    ? "Saving..."
                                    : done
                                      ? "Undo"
                                      : "Mark Done"}
                                </Button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteHabit(habit._id, habit.name)
                                  }
                                  disabled={deletingHabitId === habit._id}
                                  className="inline-flex w-full items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                  aria-label="Delete habit"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metrics Section */}
              <Card className="flex h-full flex-col border-emerald-500/25 bg-gradient-to-br from-emerald-500/6 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <CalendarDays className="h-5 w-5 text-emerald-400" />
                      Daily Metrics
                    </CardTitle>
                    {dateBadge}
                  </div>
                  {metricsSubmitted && (
                    <span className="inline-flex w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                      Submitted
                    </span>
                  )}
                  <CardDescription>
                    Quantify your day to understand your baseline.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-6">
                  <div className="flex w-full flex-col gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        <Moon className="h-3 w-3" /> Sleep
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          placeholder="Hours"
                          min={0}
                          max={24}
                          step={1}
                          value={metrics.sleepHours}
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              sleepHours: clampNumberInput(
                                e.target.value,
                                0,
                                24,
                              ),
                            })
                          }
                          className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                        />
                        <Input
                          type="number"
                          placeholder="Minutes"
                          min={0}
                          max={59}
                          step={1}
                          value={metrics.sleepMinutes}
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              sleepMinutes: clampNumberInput(
                                e.target.value,
                                0,
                                59,
                              ),
                            })
                          }
                          className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        <Monitor className="h-3 w-3" /> Screen Time
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          placeholder="Hours"
                          min={0}
                          max={24}
                          step={1}
                          value={metrics.screenHours}
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              screenHours: clampNumberInput(
                                e.target.value,
                                0,
                                24,
                              ),
                            })
                          }
                          className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                        />
                        <Input
                          type="number"
                          placeholder="Minutes"
                          min={0}
                          max={59}
                          step={1}
                          value={metrics.screenMinutes}
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              screenMinutes: clampNumberInput(
                                e.target.value,
                                0,
                                59,
                              ),
                            })
                          }
                          className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        <Briefcase className="h-3 w-3" /> Work/Study
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          type="number"
                          placeholder="Hours"
                          min={0}
                          max={24}
                          step={1}
                          value={metrics.workStudyHours}
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              workStudyHours: clampNumberInput(
                                e.target.value,
                                0,
                                24,
                              ),
                            })
                          }
                          className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                        />
                        <Input
                          type="number"
                          placeholder="Minutes"
                          min={0}
                          max={59}
                          step={1}
                          value={metrics.workStudyMinutes}
                          onChange={(e) =>
                            setMetrics({
                              ...metrics,
                              workStudyMinutes: clampNumberInput(
                                e.target.value,
                                0,
                                59,
                              ),
                            })
                          }
                          className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        <span className="text-xs font-bold">
                          {expenseSymbol}
                        </span>
                        Expenses ({expenseCurrency})
                      </label>
                      <Input
                        type="number"
                        placeholder="0.0"
                        value={metrics.expense}
                        onChange={(e) =>
                          setMetrics({ ...metrics, expense: e.target.value })
                        }
                        className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveMetrics}
                    disabled={savingMetrics}
                    className="mt-auto w-full bg-pink-600 text-white hover:bg-pink-500"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingMetrics
                      ? "Saving..."
                      : `Save ${selectedDateLabel} Metrics`}
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex h-full flex-col border-rose-500/25 bg-gradient-to-br from-rose-500/6 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
                <CardHeader className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Heart className="h-5 w-5 text-rose-400" />
                        Daily Emotion
                      </CardTitle>
                      {dateBadge}
                    </div>
                    {emotionLoaded && emotionSubmitted && (
                      <span className="inline-flex w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                        Submitted
                      </span>
                    )}
                    <CardDescription>
                      Select how you feel for the selected day and save it to
                      your log.
                    </CardDescription>
                    {emotionLoaded && (
                      <p className="text-xs text-slate-500">
                        {emotionLocked
                          ? `The emotion entry for ${selectedDateLabel} is locked by the backend after 24 hours.`
                          : ""}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-5">
                  <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                    {emotionOptions.map((option) => {
                      const isSelected = selectedEmotion === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={emotionLocked}
                          onClick={() => setSelectedEmotion(option.value)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                            isSelected
                              ? `${option.accent} ${option.glow} scale-[1.02]`
                              : option.idle
                          } ${emotionLocked ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg leading-none">
                              {option.emoji}
                            </span>
                            <span className="flex flex-col">
                              <span className="font-semibold">
                                {option.label}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    onClick={handleSaveEmotion}
                    disabled={savingEmotion || emotionLocked}
                    className="mt-auto w-full bg-pink-600 text-white hover:bg-pink-500"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingEmotion
                      ? "Saving..."
                      : emotionLocked
                        ? "Emotion Locked"
                        : `Save ${selectedDateLabel} Emotion`}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Life Ratings Section */}
            <Card className="mt-6 border-amber-500/25 bg-gradient-to-br from-amber-500/6 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
              <CardHeader>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-400" />
                      Life Balance
                    </CardTitle>
                    {dateBadge}
                  </div>
                  {lifeRatingsLoaded && lifeRatingsSubmitted && (
                    <span className="inline-flex w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                      Submitted
                    </span>
                  )}
                  <CardDescription>
                    Rate your satisfaction across 8 key areas of your life
                    (0-10).
                  </CardDescription>
                  {lifeRatingsLoaded && (
                    <p className="mt-2 text-xs text-slate-500">
                      {lifeRatingsLocked
                        ? `The life rating entry for ${selectedDateLabel} is locked by the backend after 24 hours.`
                        : `These 8 sliders are synced with the ${selectedDateLabel} backend life rating entry.`}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
                  {lifeRatingCategories.map((cat) => (
                    <div key={cat.key} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <cat.icon className={`h-3.5 w-3.5 ${cat.color}`} />{" "}
                          {cat.label}
                        </label>
                        <span className="text-sm font-bold text-white bg-white/5 px-2 py-0.5 rounded-md">
                          {lifeRatings[cat.key]}
                        </span>
                      </div>
                      <div className="relative group pt-2 px-1">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={lifeRatings[cat.key]}
                          disabled={lifeRatingsLocked}
                          onChange={(e) =>
                            setLifeRatings({
                              ...lifeRatings,
                              [cat.key]: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 group-hover:bg-white/20 transition-all"
                        />
                        <div className="flex justify-between mt-2 px-0.5">
                          {[0, 2, 4, 6, 8, 10].map((tick) => (
                            <span
                              key={tick}
                              className="text-[10px] text-slate-600 font-medium"
                            >
                              {tick}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleSaveLifeRatings}
                  disabled={savingLifeRatings || lifeRatingsLocked}
                  className="w-full bg-pink-600 text-white shadow-lg shadow-pink-900/20 hover:bg-pink-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingLifeRatings
                    ? "Saving..."
                    : lifeRatingsLocked
                      ? "Life Ratings Locked"
                      : `Save ${selectedDateLabel} Ratings`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <MobileTabBar items={navItems} />
    </div>
  );
}
