import { useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpenText,
  CalendarDays,
  ChartColumnBig,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, getApiErrorMessage } from "../lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HeatmapSkeleton,
  ListSkeleton,
  TextSkeleton,
} from "@/components/SkeletonBoneyard";

const navItems = [
  { label: "Today", icon: LayoutDashboard, to: "/dashboard", active: true },
  { label: "Journal", icon: BookOpenText, to: "/journal" },
  { label: "Track", icon: CheckCircle2, to: "/track" },
  { label: "Analytics", icon: ChartColumnBig, to: "/analytics" },
  { label: "Organise", icon: FolderKanban, to: "/organise" },
  { label: "Profile", icon: User, to: "/profile" },
];

const journalEntries = [
  "Write a short evening reflection about what made today easier.",
  "Capture one uncomfortable thought before it becomes mental noise.",
  "Note the moment you felt most energised and why.",
];

const trackingLabels = {
  sleep: "Sleep",
  screen: "Screen time",
  workStudy: "Work / Study",
  expense: "Expense",
};

const organiseItems = [
  "Review weekly timetable blocks",
  "Sort idea pad into goals and experiments",
  "Plan tomorrow's top 3 priorities",
];

const HEATMAP_BASE = { r: 236, g: 72, b: 153 };
const heatmapWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HEATMAP_HABIT_WEIGHT = 0.5;
const HEATMAP_MAX_MONTHS_BACK = 11;
const INPUT_STREAK_DAYS = 900;
const BADGE_TIERS = [
  {
    label: "Bronze I",
    minDays: 7,
    className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  {
    label: "Bronze II",
    minDays: 30,
    className: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  },
  {
    label: "Silver I",
    minDays: 90,
    className: "border-slate-400/40 bg-slate-400/10 text-slate-200",
  },
  {
    label: "Silver II",
    minDays: 180,
    className: "border-slate-400/40 bg-slate-400/10 text-slate-200",
  },
  {
    label: "Gold I",
    minDays: 365,
    className: "border-yellow-400/40 bg-yellow-400/10 text-yellow-200",
  },
  {
    label: "Gold II",
    minDays: 455,
    className: "border-yellow-400/40 bg-yellow-400/10 text-yellow-200",
  },
  {
    label: "Platinum I",
    minDays: 545,
    className: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  },
  {
    label: "Platinum II",
    minDays: 635,
    className: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  },
  {
    label: "Diamond I",
    minDays: 725,
    className: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  },
  {
    label: "Diamond II",
    minDays: 815,
    className: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  },
];

function toDateKey(dateInput) {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toStartOfDay(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function isTodayInRange(startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = startDate ? toStartOfDay(startDate) : null;
  const end = endDate ? toStartOfDay(endDate) : null;
  if (start && end) return today >= start && today <= end;
  if (start) return today >= start;
  if (end) return today <= end;
  return false;
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "";
  const startLabel = startDate ? toDateKey(startDate) : "--";
  const endLabel = endDate ? toDateKey(endDate) : "--";
  return `${startLabel} - ${endLabel}`;
}

function isStartDateToday(dateInput) {
  if (!dateInput) return false;
  return toDateKey(dateInput) === toDateKey(new Date());
}

function getDueLabel(endDate) {
  const days = daysUntilDate(endDate);
  if (days === null) return "";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `Due in ${days} days`;
  const overdue = Math.abs(days);
  return overdue === 1 ? "Overdue by 1 day" : `Overdue by ${overdue} days`;
}

function daysUntilDate(dateInput) {
  const target = toStartOfDay(dateInput);
  if (!target) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function getMonthRange(offset) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() + offset);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function buildHeatmapRange(start, end) {
  const items = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cursor <= last) {
    items.push({
      date: new Date(cursor),
      key: toDateKey(cursor),
      count: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return items;
}

function entryHasDiaryInput(entry) {
  if (!entry) return false;
  if (entry.text && String(entry.text).trim().length > 0) return true;
  if (entry.rating !== undefined && entry.rating !== null) return true;
  if (entry.metrics && Object.keys(entry.metrics).length > 0) return true;
  return false;
}

function countLifeRatings(entry) {
  if (!entry?.ratings) return 0;
  return Object.values(entry.ratings).reduce(
    (total, value) =>
      value !== null && value !== undefined ? total + 1 : total,
    0,
  );
}

async function fetchActivitySources({ from, to, limit }) {
  const [diaryRes, timeRes, lifeRes, emotionRes, habitsRes] = await Promise.all(
    [
      api.get(`/diary/range?from=${from}&to=${to}&limit=${limit}`),
      api.get(`/time-tracker?from=${from}&to=${to}&limit=${limit}`),
      api.get(`/life-ratings/range?from=${from}&to=${to}&limit=${limit}`),
      api.get(`/emotions/range?from=${from}&to=${to}&limit=${limit}`),
      api.get("/habits"),
    ],
  );

  return {
    diaryEntries: diaryRes?.data?.entries || [],
    timeEntries: timeRes?.data?.entries || [],
    lifeEntries: lifeRes?.data?.entries || [],
    emotionEntries: emotionRes?.data?.emotions || [],
    habits: habitsRes?.data?.habits || [],
  };
}

function applyActivityCounts(dayMap, activitySources) {
  const { diaryEntries, timeEntries, lifeEntries, emotionEntries, habits } =
    activitySources;

  for (const entry of diaryEntries) {
    const key = toDateKey(entry.date);
    if (dayMap.has(key) && entryHasDiaryInput(entry)) {
      dayMap.get(key).count += 1;
    }
  }

  for (const entry of timeEntries) {
    const key = toDateKey(entry.date);
    if (dayMap.has(key)) {
      dayMap.get(key).count += 1;
    }
  }

  for (const entry of lifeEntries) {
    const key = toDateKey(entry.date);
    if (dayMap.has(key)) {
      dayMap.get(key).count += countLifeRatings(entry);
    }
  }

  for (const entry of emotionEntries) {
    const key = toDateKey(entry.date);
    if (dayMap.has(key)) {
      dayMap.get(key).count += 1;
    }
  }

  for (const habit of habits) {
    if (!Array.isArray(habit.history)) continue;
    for (const historyEntry of habit.history) {
      if (!historyEntry?.completed) continue;
      const key = toDateKey(historyEntry.date);
      if (dayMap.has(key)) {
        dayMap.get(key).count += HEATMAP_HABIT_WEIGHT;
      }
    }
  }
}

function getEarnedBadges(streak) {
  return BADGE_TIERS.filter((tier) => streak >= tier.minDays);
}

function getNextBadge(streak) {
  return BADGE_TIERS.find((tier) => streak < tier.minDays) || null;
}

const journalEntryThemes = [
  "border-pink-500/20 bg-pink-500/5",
  "border-violet-500/20 bg-violet-500/5",
  "border-sky-500/20 bg-sky-500/5",
];

const trackingItemThemes = [
  "border-emerald-500/20 bg-emerald-500/5",
  "border-blue-500/20 bg-blue-500/5",
  "border-amber-500/20 bg-amber-500/5",
  "border-rose-500/20 bg-rose-500/5",
];

const analyticsStatThemes = [
  "border-indigo-500/20 bg-indigo-500/10",
  "border-emerald-500/20 bg-emerald-500/10",
  "border-amber-500/20 bg-amber-500/10",
];

const organiseItemThemes = [
  "border-cyan-500/20 bg-cyan-500/5",
  "border-fuchsia-500/20 bg-fuchsia-500/5",
  "border-lime-500/20 bg-lime-500/5",
];

const welcomeMessages = [
  {
    title: "Welcome back",
    message: "Start with one calm, focused task and let momentum do the rest.",
    accent: "from-pink-500/20 via-rose-500/10 to-transparent",
  },
  {
    title: "Fresh slate",
    message: "Pick the smallest win that makes everything else feel lighter.",
    accent: "from-emerald-500/20 via-emerald-500/10 to-transparent",
  },
  {
    title: "Steady progress",
    message: "Keep the signal strong: one clear priority, one clear finish.",
    accent: "from-indigo-500/20 via-indigo-500/10 to-transparent",
  },
  {
    title: "Today is yours",
    message: "Log what matters, let the rest fade to background noise.",
    accent: "from-amber-500/20 via-amber-500/10 to-transparent",
  },
  {
    title: "Intentional day",
    message: "Protect your attention with one boundary you can keep.",
    accent: "from-sky-500/20 via-sky-500/10 to-transparent",
  },
  {
    title: "Momentum check",
    message: "Small steps count. Stack a few and call it a win.",
    accent: "from-violet-500/20 via-violet-500/10 to-transparent",
  },
  {
    title: "Grounded focus",
    message: "Breathe, choose one meaningful action, and commit to it.",
    accent: "from-teal-500/20 via-teal-500/10 to-transparent",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [averages, setAverages] = useState(null);
  const [averagesError, setAveragesError] = useState("");
  const [habitScore, setHabitScore] = useState(null);
  const [habitScoreError, setHabitScoreError] = useState("");
  const [inputStreak, setInputStreak] = useState(0);
  const [inputStreakError, setInputStreakError] = useState("");
  const [inputStreakLoading, setInputStreakLoading] = useState(true);
  const [heatmapDays, setHeatmapDays] = useState([]);
  const [heatmapError, setHeatmapError] = useState("");
  const [heatmapMax, setHeatmapMax] = useState(0);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [heatmapMonthOffset, setHeatmapMonthOffset] = useState(0);
  const [heatmapSlideDirection, setHeatmapSlideDirection] = useState(1);
  const [heatmapJumpDate, setHeatmapJumpDate] = useState("");
  const [heatmapJumpError, setHeatmapJumpError] = useState("");
  const [todoItems, setTodoItems] = useState([]);
  const [todoError, setTodoError] = useState("");
  const [todoLoading, setTodoLoading] = useState(true);
  const [todoPadStats, setTodoPadStats] = useState({});
  const heatmapTouchStart = useRef(null);
  const heatmapDatePickerRef = useRef(null);

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const welcomeMessage = welcomeMessages[dayOfYear % welcomeMessages.length];

  useEffect(() => {
    let isMounted = true;

    async function fetchAverages() {
      try {
        const { data } = await api.get("/time-tracker/averages");
        if (isMounted) {
          setAverages(data);
          setAveragesError("");
        }
      } catch (error) {
        if (isMounted) {
          setAverages(null);
          setAveragesError(
            getApiErrorMessage(error, "Unable to load averages"),
          );
        }
      }
    }

    async function fetchHabitScore() {
      try {
        const { data } = await api.get("/habits/score?days=7");
        if (isMounted) {
          setHabitScore(data);
          setHabitScoreError("");
        }
      } catch (error) {
        if (isMounted) {
          setHabitScore(null);
          setHabitScoreError(
            getApiErrorMessage(error, "Unable to load habit score"),
          );
        }
      }
    }

    fetchAverages();
    fetchHabitScore();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchTodoItems() {
      setTodoLoading(true);
      try {
        const { data } = await api.get("/pads");
        const pads = data?.pads || [];
        const stats = pads.reduce((acc, pad) => {
          const items = pad.items || [];
          const total = items.length;
          const done = items.filter((item) => item.done).length;
          acc[pad._id] = {
            padTitle: pad.title,
            done,
            total,
            ratio: total > 0 ? done / total : 0,
          };
          return acc;
        }, {});

        const activeItems = pads.flatMap((pad) =>
          (pad.items || [])
            .filter((item) => !item.done)
            .filter((item) =>
              item.startDate || item.endDate
                ? isTodayInRange(item.startDate, item.endDate)
                : true,
            )
            .map((item) => ({
              id: item._id,
              title: item.title,
              padId: pad._id,
              padTitle: pad.title,
              startDate: item.startDate,
              endDate: item.endDate,
              createdAt: item.createdAt,
            })),
        );

        if (isMounted) {
          setTodoItems(activeItems);
          setTodoPadStats(stats);
          setTodoError("");
        }
      } catch (error) {
        if (isMounted) {
          setTodoItems([]);
          setTodoError(getApiErrorMessage(error, "Unable to load todo items"));
        }
      } finally {
        if (isMounted) {
          setTodoLoading(false);
        }
      }
    }

    fetchTodoItems();

    return () => {
      isMounted = false;
    };
  }, []);

  const heatmapMonthRange = useMemo(
    () => getMonthRange(heatmapMonthOffset),
    [heatmapMonthOffset],
  );
  const heatmapMonthLabel = useMemo(
    () =>
      heatmapMonthRange.start.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [heatmapMonthRange],
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchHeatmap() {
      setHeatmapLoading(true);
      try {
        const range = buildHeatmapRange(
          heatmapMonthRange.start,
          heatmapMonthRange.end,
        );
        const from = range[0]?.key;
        const to = range[range.length - 1]?.key;
        if (!from || !to) {
          if (isMounted) {
            setHeatmapDays([]);
            setHeatmapMax(0);
            setHeatmapError("");
          }
          return;
        }

        const dayMap = new Map(range.map((item) => [item.key, { ...item }]));
        const limit = range.length;

        const activitySources = await fetchActivitySources({ from, to, limit });
        applyActivityCounts(dayMap, activitySources);

        const days = Array.from(dayMap.values());
        const maxCount = days.reduce(
          (max, item) => Math.max(max, item.count),
          0,
        );
        if (isMounted) {
          setHeatmapDays(days);
          setHeatmapMax(maxCount);
          setHeatmapError("");
        }
      } catch (error) {
        if (isMounted) {
          setHeatmapDays([]);
          setHeatmapMax(0);
          setHeatmapError(
            getApiErrorMessage(error, "Unable to load consistency heatmap"),
          );
        }
      } finally {
        if (isMounted) {
          setHeatmapLoading(false);
        }
      }
    }

    fetchHeatmap();

    return () => {
      isMounted = false;
    };
  }, [heatmapMonthRange]);

  const heatmapTransitionKey = `${heatmapMonthRange.start.getFullYear()}-${heatmapMonthRange.start.getMonth()}`;

  useEffect(() => {
    let isMounted = true;

    async function fetchInputStreak() {
      setInputStreakLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(today);
        start.setDate(start.getDate() - (INPUT_STREAK_DAYS - 1));

        const range = buildHeatmapRange(start, today);
        const from = range[0]?.key;
        const to = range[range.length - 1]?.key;
        if (!from || !to) {
          if (isMounted) {
            setInputStreak(0);
            setInputStreakError("");
          }
          return;
        }

        const dayMap = new Map(range.map((item) => [item.key, { ...item }]));
        const limit = range.length;

        const activitySources = await fetchActivitySources({ from, to, limit });
        applyActivityCounts(dayMap, activitySources);

        let streak = 0;
        for (let i = range.length - 1; i >= 0; i -= 1) {
          const day = dayMap.get(range[i].key);
          if (!day || day.count <= 0) break;
          streak += 1;
        }

        if (isMounted) {
          setInputStreak(streak);
          setInputStreakError("");
        }
      } catch (error) {
        if (isMounted) {
          setInputStreak(0);
          setInputStreakError(
            getApiErrorMessage(error, "Unable to load input streak"),
          );
        }
      } finally {
        if (isMounted) {
          setInputStreakLoading(false);
        }
      }
    }

    fetchInputStreak();

    return () => {
      isMounted = false;
    };
  }, []);

  const heatmapCells = useMemo(() => {
    if (heatmapDays.length === 0) return [];
    const firstDay = heatmapDays[0].date.getDay();
    const startOffset = (firstDay + 6) % 7;
    const padded = Array.from({ length: startOffset }, () => null);
    return [...padded, ...heatmapDays];
  }, [heatmapDays]);

  const heatmapLegend = useMemo(() => {
    if (heatmapMax <= 0) return [0, 1, 2, 3];
    return [
      0,
      Math.ceil(heatmapMax * 0.25),
      Math.ceil(heatmapMax * 0.5),
      Math.ceil(heatmapMax * 0.75),
    ];
  }, [heatmapMax]);
  const heatmapMinDate = useMemo(
    () => toDateKey(getMonthRange(-HEATMAP_MAX_MONTHS_BACK).start),
    [],
  );
  const heatmapMaxDate = useMemo(() => toDateKey(new Date()), []);

  const clampMonthOffset = (offset) =>
    Math.min(0, Math.max(-HEATMAP_MAX_MONTHS_BACK, offset));

  const canGoPrevMonth = heatmapMonthOffset > -HEATMAP_MAX_MONTHS_BACK;
  const canGoNextMonth = heatmapMonthOffset < 0;

  const shiftHeatmapMonth = (delta) => {
    setHeatmapSlideDirection(delta < 0 ? -1 : 1);
    setHeatmapMonthOffset((prev) => clampMonthOffset(prev + delta));
  };

  const handleHeatmapTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (!touch) return;
    heatmapTouchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleHeatmapTouchEnd = (event) => {
    const start = heatmapTouchStart.current;
    if (!start) return;
    const touch = event.changedTouches?.[0];
    heatmapTouchStart.current = null;
    if (!touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX > 0) {
      if (canGoPrevMonth) shiftHeatmapMonth(-1);
      return;
    }
    if (canGoNextMonth) shiftHeatmapMonth(1);
  };

  const getMonthOffsetForDate = (date) => {
    const now = new Date();
    return (
      (date.getFullYear() - now.getFullYear()) * 12 +
      (date.getMonth() - now.getMonth())
    );
  };

  const handleHeatmapJump = (selectedDate) => {
    if (!selectedDate) {
      setHeatmapJumpError("Choose a date to jump to.");
      return;
    }
    const parsed = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      setHeatmapJumpError("Enter a valid date.");
      return;
    }
    const offset = getMonthOffsetForDate(parsed);
    if (offset > 0) {
      setHeatmapJumpError("Pick a date in the past.");
      return;
    }
    if (offset < -HEATMAP_MAX_MONTHS_BACK) {
      setHeatmapJumpError("Pick a date within the last 12 months.");
      return;
    }
    setHeatmapJumpError("");
    setHeatmapSlideDirection(offset < heatmapMonthOffset ? -1 : 1);
    setHeatmapMonthOffset(clampMonthOffset(offset));
  };

  const openHeatmapDatePicker = () => {
    const picker = heatmapDatePickerRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }
    picker.focus();
    picker.click();
  };

  const heatmapSlideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({
      x: direction > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  function getHeatmapStyle(count) {
    if (!count || heatmapMax === 0) {
      return {
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        borderColor: "rgba(148, 163, 184, 0.12)",
      };
    }
    const intensity = Math.min(1, count / heatmapMax);
    const alpha = 0.2 + intensity * 0.7;
    return {
      backgroundColor: `rgba(${HEATMAP_BASE.r}, ${HEATMAP_BASE.g}, ${HEATMAP_BASE.b}, ${alpha})`,
      borderColor: `rgba(${HEATMAP_BASE.r}, ${HEATMAP_BASE.g}, ${HEATMAP_BASE.b}, ${Math.min(0.95, alpha + 0.1)})`,
    };
  }

  const habitScoreValue =
    habitScore && habitScore.total > 0
      ? `${habitScore.completed} / ${habitScore.total}`
      : "—";
  const habitScoreNote = habitScoreError
    ? habitScoreError
    : habitScore && habitScore.total > 0
      ? `${habitScore.percent}% completion (last ${habitScore.days} days)`
      : "No habits tracked yet";

  const earnedBadges = useMemo(
    () => getEarnedBadges(inputStreak),
    [inputStreak],
  );
  const nextBadge = useMemo(() => getNextBadge(inputStreak), [inputStreak]);

  const todayCards = [
    {
      title: "Morning focus",
      value: "2h 20m",
      note: "Deep work logged before noon",
      accent: "from-pink-500/25 to-rose-500/5",
      border: "border-pink-500/25",
      background: "from-pink-500/12 via-slate-900/70 to-slate-950/95",
    },
    {
      title: "Mood pulse",
      value: "Calm + Sharp",
      note: "Better than your 7-day average",
      accent: "from-emerald-500/20 to-emerald-500/5",
      border: "border-emerald-500/25",
      background: "from-emerald-500/12 via-slate-900/70 to-slate-950/95",
    },
    {
      title: "Habit score",
      value: habitScoreValue,
      note: habitScoreNote,
      accent: "from-indigo-500/20 to-indigo-500/5",
      border: "border-indigo-500/25",
      background: "from-indigo-500/12 via-slate-900/70 to-slate-950/95",
    },
  ];

  const trackingItems = [
    {
      label: trackingLabels.sleep,
      value:
        averages?.avgSleep !== undefined
          ? `${averages.avgSleep.toFixed(1)} hrs`
          : "—",
    },
    {
      label: trackingLabels.screen,
      value:
        averages?.avgScreen !== undefined
          ? `${averages.avgScreen.toFixed(1)} hrs`
          : "—",
    },
    {
      label: trackingLabels.workStudy,
      value:
        averages?.avgWorkStudy !== undefined
          ? `${averages.avgWorkStudy.toFixed(1)} hrs`
          : "—",
    },
    {
      label: trackingLabels.expense,
      value:
        averages?.avgExpense !== undefined
          ? `${averages.avgExpense.toFixed(0)}`
          : "—",
    },
  ];

  const todoSections = useMemo(() => {
    if (todoItems.length === 0) return [];

    const startsToday = todoItems.filter((item) =>
      isStartDateToday(item.startDate),
    );
    const remainingItems = todoItems.filter(
      (item) => !isStartDateToday(item.startDate),
    );
    const withEndDate = remainingItems.filter((item) => item.endDate);
    const withoutEndDate = remainingItems.filter((item) => !item.endDate);
    const urgent = withEndDate.filter((item) => {
      const days = daysUntilDate(item.endDate);
      return days !== null && days <= 2;
    });
    const dueSoon = withEndDate.filter((item) => {
      const days = daysUntilDate(item.endDate);
      return days !== null && days >= 3 && days <= 7;
    });
    const later = withEndDate.filter((item) => {
      const days = daysUntilDate(item.endDate);
      return days !== null && days > 7;
    });

    const sortByEndDate = (left, right) => {
      const leftDays = daysUntilDate(left.endDate) ?? Number.POSITIVE_INFINITY;
      const rightDays =
        daysUntilDate(right.endDate) ?? Number.POSITIVE_INFINITY;
      if (leftDays !== rightDays) return leftDays - rightDays;
      const leftCreated = left.createdAt ? new Date(left.createdAt) : null;
      const rightCreated = right.createdAt ? new Date(right.createdAt) : null;
      if (leftCreated && rightCreated) return rightCreated - leftCreated;
      if (leftCreated) return -1;
      if (rightCreated) return 1;
      return 0;
    };

    urgent.sort(sortByEndDate);
    dueSoon.sort(sortByEndDate);
    later.sort(sortByEndDate);

    return [
      {
        title: "Urgent work",
        items: urgent,
        itemClass: "border-rose-500/25 bg-rose-500/10",
      },
      {
        title: "Starting today",
        items: startsToday,
        itemClass: "border-emerald-500/25 bg-emerald-500/10",
      },
      {
        title: "Due soon",
        items: dueSoon,
        itemClass: "border-amber-500/25 bg-amber-500/10",
      },
      {
        title: "Ongoing",
        items: withoutEndDate,
        itemClass: "border-cyan-500/20 bg-cyan-500/5",
      },
      {
        title: "Later",
        items: later,
        itemClass: "border-slate-500/20 bg-white/5",
      },
    ].filter((section) => section.items.length > 0);
  }, [todoItems]);

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
              transition={{ duration: 0.45 }}
              className="mb-6 overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] shadow-2xl backdrop-blur-xl"
            >
              <div
                className={`h-1 w-full bg-gradient-to-r ${welcomeMessage.accent}`}
              />
              <div className="flex flex-col gap-2 p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {welcomeMessage.title}
                </p>
                <p className="text-lg font-semibold text-white sm:text-xl">
                  {welcomeMessage.message}
                </p>
                <p className="text-sm text-slate-400">
                  {user?.firstName
                    ? `Glad to see you, ${user.firstName}.`
                    : "Glad to see you back."}
                </p>
              </div>
            </motion.section>

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
                    Today
                  </p>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                      Build a calm, measurable day.
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                      Journal clearly, track the essentials, and keep your plans
                      close enough to act on.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="bg-pink-600 text-white hover:bg-pink-500"
                  >
                    <Link to="/journal">New journal entry</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  >
                    <Link to="/analytics">Review analytics</Link>
                  </Button>
                </div>
              </div>
            </motion.section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-3">
                  {todayCards.map((card, index) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.08 }}
                    >
                      <Card
                        className={`overflow-hidden border ${card.border} bg-gradient-to-br ${card.background} backdrop-blur-xl`}
                      >
                        <div
                          className={`h-1 w-full bg-gradient-to-r ${card.accent}`}
                        />
                        <CardHeader>
                          <CardDescription>{card.title}</CardDescription>
                          <CardTitle className="text-2xl text-white">
                            {card.value}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-400">{card.note}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Sparkles className="h-5 w-5 text-pink-300" />
                      Streak milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {inputStreakError && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                        {inputStreakError}
                      </div>
                    )}
                    {inputStreakLoading && !inputStreakError && (
                      <TextSkeleton lines={3} />
                    )}
                    {!inputStreakLoading && !inputStreakError && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-2xl font-bold text-white">
                            {inputStreak} days
                          </span>
                          <span className="text-sm text-slate-400">
                            daily input streak
                          </span>
                        </div>
                        {earnedBadges.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {earnedBadges.map((tier) => (
                              <span
                                key={tier.label}
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${tier.className}`}
                              >
                                {tier.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">
                            Log today to unlock Bronze I.
                          </p>
                        )}
                        {nextBadge && inputStreak < nextBadge.minDays && (
                          <p className="text-xs text-slate-500">
                            Next badge in {nextBadge.minDays - inputStreak}{" "}
                            days.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <CalendarDays className="h-5 w-5 text-pink-300" />
                        Consistency heatmap
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <button
                          type="button"
                          onClick={() => shiftHeatmapMonth(-1)}
                          disabled={!canGoPrevMonth}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                            canGoPrevMonth
                              ? "border-white/15 bg-white/5 text-slate-200 hover:border-pink-500/40 hover:text-white"
                              : "border-white/5 text-slate-600 opacity-60"
                          }`}
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={openHeatmapDatePicker}
                          className="min-w-[120px] rounded-lg px-2 py-1 text-center text-slate-300 transition-all hover:bg-white/5 hover:text-white"
                          aria-label="Open calendar to jump to a date"
                          title="Jump to date"
                        >
                          {heatmapMonthLabel}
                        </button>
                        <input
                          ref={heatmapDatePickerRef}
                          type="date"
                          value={heatmapJumpDate}
                          onChange={(event) => {
                            const selectedDate = event.target.value;
                            setHeatmapJumpDate(selectedDate);
                            handleHeatmapJump(selectedDate);
                          }}
                          min={heatmapMinDate}
                          max={heatmapMaxDate}
                          className="pointer-events-none absolute h-0 w-0 opacity-0"
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                        <button
                          type="button"
                          onClick={() => shiftHeatmapMonth(1)}
                          disabled={!canGoNextMonth}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                            canGoNextMonth
                              ? "border-white/15 bg-white/5 text-slate-200 hover:border-pink-500/40 hover:text-white"
                              : "border-white/5 text-slate-600 opacity-60"
                          }`}
                          aria-label="Next month"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <CardDescription>
                      Darker cells mean more inputs logged that day.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {heatmapError && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                        {heatmapError}
                      </div>
                    )}
                    {heatmapJumpError && (
                      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                        {heatmapJumpError}
                      </div>
                    )}
                    <div className="relative min-h-[240px] overflow-hidden">
                      {heatmapLoading && <HeatmapSkeleton />}
                      <AnimatePresence
                        mode="wait"
                        initial={false}
                        custom={heatmapSlideDirection}
                      >
                        {!heatmapLoading && heatmapDays.length > 0 && (
                          <motion.div
                            key={heatmapTransitionKey}
                            custom={heatmapSlideDirection}
                            variants={heatmapSlideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                              duration: 0.35,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="absolute inset-0 space-y-3"
                            onTouchStart={handleHeatmapTouchStart}
                            onTouchEnd={handleHeatmapTouchEnd}
                          >
                            <div className="grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                              {heatmapWeekdays.map((label) => (
                                <span key={label} className="text-center">
                                  {label}
                                </span>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                              {heatmapCells.map((day, index) => {
                                if (!day) {
                                  return (
                                    <div
                                      key={`empty-${index}`}
                                      className="h-9 rounded-lg border border-transparent"
                                    />
                                  );
                                }
                                const label = day.date.toLocaleDateString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                );
                                const countLabel = Number.isInteger(day.count)
                                  ? `${day.count}`
                                  : day.count.toFixed(1);
                                return (
                                  <div
                                    key={day.key}
                                    className="h-9 rounded-lg border transition-all hover:scale-[1.02]"
                                    style={getHeatmapStyle(day.count)}
                                    title={`${label}: ${countLabel} inputs`}
                                  />
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>Less</span>
                              <div className="flex items-center gap-2">
                                {heatmapLegend.map((value) => (
                                  <div
                                    key={`legend-${value}`}
                                    className="h-3 w-3 rounded border"
                                    style={getHeatmapStyle(value)}
                                  />
                                ))}
                              </div>
                              <span>More</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {!heatmapLoading &&
                      heatmapDays.length === 0 &&
                      !heatmapError && (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                          Start logging to see your consistency heatmap.
                        </div>
                      )}
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl transition-transform hover:-translate-y-0.5">
                    <Link to="/journal" className="block h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <BookOpenText className="h-5 w-5 text-pink-400" />
                          Journal
                        </CardTitle>
                        <CardDescription>
                          Prompts to help you turn thoughts into useful
                          reflection.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {journalEntries.map((entry, index) => (
                          <div
                            key={entry}
                            className={`rounded-2xl border p-4 text-sm leading-6 text-slate-300 ${
                              journalEntryThemes[
                                index % journalEntryThemes.length
                              ]
                            }`}
                          >
                            {entry}
                          </div>
                        ))}
                      </CardContent>
                    </Link>
                  </Card>

                  <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl transition-transform hover:-translate-y-0.5">
                    <Link
                      to="/analytics#time-allocation"
                      className="block h-full"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Clock3 className="h-5 w-5 text-emerald-400" />
                          Track
                        </CardTitle>
                        <CardDescription>
                          Your quick quantitative snapshot for today.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {averagesError && (
                          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                            {averagesError}
                          </div>
                        )}
                        {trackingItems.map((item, index) => (
                          <div
                            key={item.label}
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                              trackingItemThemes[
                                index % trackingItemThemes.length
                              ]
                            }`}
                          >
                            <span className="text-sm text-slate-400">
                              {item.label}
                            </span>
                            <span className="text-sm font-medium text-slate-100">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Link>
                  </Card>
                </div>
              </div>

              <div className="grid gap-6">
                <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl transition-transform hover:-translate-y-0.5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <ListTodo className="h-5 w-5 text-cyan-300" />
                      Active todos today
                    </CardTitle>
                    <CardDescription>
                      Items scheduled for today across your pads.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {todoError && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                        {todoError}
                      </div>
                    )}
                    {todoLoading && !todoError && (
                      <ListSkeleton rows={3} />
                    )}
                    {!todoLoading && !todoError && todoItems.length === 0 && (
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                        No items active today.
                      </div>
                    )}
                    {!todoLoading && !todoError && todoSections.length > 0 && (
                      <div className="max-h-[280px] space-y-3 overflow-y-auto pr-2">
                        {todoSections.map((section) => (
                          <div key={section.title} className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                              <span>{section.title}</span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                                {section.items.length}
                              </span>
                            </div>
                            {section.items.map((item) => (
                              <Link
                                key={item.id}
                                to={`/organise?padId=${item.padId}&itemId=${item.id}`}
                                className={`block rounded-2xl border p-4 transition-transform hover:-translate-y-0.5 ${section.itemClass}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-white">
                                      {item.title}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {item.padTitle}
                                    </p>
                                    {todoPadStats[item.padId]?.total > 0 && (
                                      <div className="mt-2 space-y-1">
                                        <div className="h-1.5 w-full rounded-full bg-white/5">
                                          <div
                                            className="h-1.5 rounded-full bg-emerald-400/70"
                                            style={{
                                              width: `${Math.round(todoPadStats[item.padId].ratio * 100)}%`,
                                            }}
                                          />
                                        </div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                          {todoPadStats[item.padId].done}/
                                          {todoPadStats[item.padId].total} done
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-2 text-xs text-slate-200">
                                    <span>
                                      {formatDateRange(
                                        item.startDate,
                                        item.endDate,
                                      )}
                                    </span>
                                    {item.endDate && (
                                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                                        {getDueLabel(item.endDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="grid gap-6">
                  <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl transition-transform hover:-translate-y-0.5">
                    <Link to="/analytics" className="block h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <ChartColumnBig className="h-5 w-5 text-indigo-400" />
                          Analytics
                        </CardTitle>
                        <CardDescription>
                          A fast read on momentum across your week.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/15 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
                            Weekly trend
                          </p>
                          <p className="mt-3 text-3xl font-black text-white">
                            +18%
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            Your consistency is up compared with last week,
                            mostly driven by lower screen time and stronger
                            morning focus.
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div
                            className={`rounded-xl border p-4 text-center ${analyticsStatThemes[0]}`}
                          >
                            <p className="text-xs uppercase tracking-widest text-slate-500">
                              Mood
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">
                              8.4
                            </p>
                          </div>
                          <div
                            className={`rounded-xl border p-4 text-center ${analyticsStatThemes[1]}`}
                          >
                            <p className="text-xs uppercase tracking-widest text-slate-500">
                              Sleep
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">
                              7.2h
                            </p>
                          </div>
                          <div
                            className={`rounded-xl border p-4 text-center ${analyticsStatThemes[2]}`}
                          >
                            <p className="text-xs uppercase tracking-widest text-slate-500">
                              Focus
                            </p>
                            <p className="mt-2 text-lg font-bold text-white">
                              81%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>

                  <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl transition-transform hover:-translate-y-0.5">
                    <Link to="/organise" className="block h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Target className="h-5 w-5 text-amber-400" />
                          Organise
                        </CardTitle>
                        <CardDescription>
                          Small planning moves that keep tomorrow lighter.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {organiseItems.map((item, index) => (
                          <div
                            key={item}
                            className={`rounded-2xl border p-4 text-sm leading-6 text-slate-300 ${
                              organiseItemThemes[
                                index % organiseItemThemes.length
                              ]
                            }`}
                          >
                            {item}
                          </div>
                        ))}
                      </CardContent>
                    </Link>
                  </Card>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
