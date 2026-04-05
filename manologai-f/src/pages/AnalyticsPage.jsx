import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BookOpenText,
  CalendarDays,
  ChartColumnBig,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  BrainCircuit,
  TrendingUp,
  Clock3,
  Moon,
  Star,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MobileTabBar from "../components/MobileTabBar";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../lib/api";

const navItems = [
  { label: "Today", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Journal", icon: BookOpenText, to: "/journal" },
  { label: "Track", icon: CheckCircle2, to: "/track" },
  { label: "Analytics", icon: ChartColumnBig, to: "/analytics", active: true },
  { label: "Organise", icon: FolderKanban, to: "/organise" },
  { label: "Profile", icon: User, to: "/profile" },
];

const EMOTION_SCORES = {
  excited: 5,
  happy: 4,
  calm: 3.5,
  neutral: 3,
  tired: 2.5,
  stressed: 2,
  sad: 1.5,
  angry: 1,
};

const EMOTION_COLORS = {
  excited: "#f472b6",
  happy: "#34d399",
  calm: "#38bdf8",
  neutral: "#94a3b8",
  tired: "#a78bfa",
  stressed: "#f59e0b",
  sad: "#60a5fa",
  angry: "#fb7185",
};

const EMOTION_LABELS = Object.entries(EMOTION_SCORES).reduce(
  (acc, [emotion, score]) => {
    acc[score] = emotion;
    return acc;
  },
  {},
);

const LIFE_RATING_FIELDS = [
  { key: "health", label: "Health" },
  { key: "finances", label: "Finances" },
  { key: "career", label: "Career" },
  { key: "partner", label: "Partner" },
  { key: "familyFriends", label: "Family" },
  { key: "physicalEnvironment", label: "Environment" },
  { key: "funRecreation", label: "Fun" },
  { key: "personalGrowth", label: "Growth" },
];

const HABIT_IMPACT_THRESHOLD = 1;
const HABIT_IMPACT_MIN_SAMPLES = 2;
const STREAK_MILESTONES = [7, 30, 100, 365];

const formatEmotionLabel = (value) => {
  const label = EMOTION_LABELS[value];
  if (!label) return value;
  return `${label[0].toUpperCase()}${label.slice(1)}`;
};

const getNearestEmotionLabel = (score) => {
  if (!Number.isFinite(score)) return "Neutral";
  const keys = Object.keys(EMOTION_LABELS)
    .map((value) => Number(value))
    .sort((a, b) => a - b);
  let nearest = keys[0];
  let minDiff = Math.abs(score - keys[0]);
  for (const key of keys) {
    const diff = Math.abs(score - key);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = key;
    }
  }
  return formatEmotionLabel(nearest);
};

const getStreakMilestones = (currentStreak) =>
  STREAK_MILESTONES.filter((milestone) => currentStreak >= milestone);

const formatEmotionName = (emotion) => {
  if (!emotion) return "Unknown";
  return `${emotion[0].toUpperCase()}${emotion.slice(1)}`;
};

const toDateKey = (dateInput) => {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_FULL = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

const getRangeWindow = (range) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const from = new Date(today);
  const daysBack = range === "year" ? 364 : range === "week" ? 6 : 29;
  from.setDate(from.getDate() - daysBack);
  from.setHours(0, 0, 0, 0);
  return { from, to: today, days: daysBack + 1 };
};

export default function AnalyticsPage() {
  const location = useLocation();
  const [pageLoading, setPageLoading] = useState(true);
  const [lifeData, setLifeData] = useState([]);
  const [moodBarData, setMoodBarData] = useState([]);
  const [moodLineData, setMoodLineData] = useState([]);
  const [moodPieData, setMoodPieData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [sleepEmotionData, setSleepEmotionData] = useState([]);
  const [dayEmotionData, setDayEmotionData] = useState([]);
  const [habitImpactData, setHabitImpactData] = useState([]);
  const [habits, setHabits] = useState([]);
  const [lifeLoading, setLifeLoading] = useState(false);
  const [moodBarLoading, setMoodBarLoading] = useState(false);
  const [moodLineLoading, setMoodLineLoading] = useState(false);
  const [moodPieLoading, setMoodPieLoading] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [sleepEmotionLoading, setSleepEmotionLoading] = useState(false);
  const [dayEmotionLoading, setDayEmotionLoading] = useState(false);
  const [habitImpactLoading, setHabitImpactLoading] = useState(false);
  const [error, setError] = useState("");
  const [lifeAverageRange, setLifeAverageRange] = useState("month");
  const [moodBarRange, setMoodBarRange] = useState("month");
  const [moodLineRange, setMoodLineRange] = useState("month");
  const [moodPieRange, setMoodPieRange] = useState("month");
  const [timeRange, setTimeRange] = useState("week");
  const [expenseRange, setExpenseRange] = useState("week");
  const [sleepEmotionRange, setSleepEmotionRange] = useState("month");
  const [sleepEmotionView, setSleepEmotionView] = useState("scatter");
  const [insightMetric, setInsightMetric] = useState("sleep");
  const [dayEmotionRange, setDayEmotionRange] = useState("month");
  const [habitImpactRange, setHabitImpactRange] = useState("month");
  const { user } = useAuth();
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!location.hash || pageLoading) return;
    const targetId = location.hash.slice(1);
    if (!targetId) return;

    let attempts = 0;
    const maxAttempts = 12;
    const tryScroll = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(tryScroll, 120);
      }
    };

    const handle = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(handle);
  }, [location.hash, pageLoading]);

  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      setError("");
      try {
        await fetchLifeData(lifeAverageRange, true);
        await fetchMoodData(
          moodBarRange,
          setMoodBarData,
          setMoodBarLoading,
          true,
        );
        await fetchMoodData(
          moodLineRange,
          setMoodLineData,
          setMoodLineLoading,
          true,
        );
        await fetchMoodData(
          moodPieRange,
          setMoodPieData,
          setMoodPieLoading,
          true,
        );
        await fetchTimeData(timeRange, true);
        await fetchExpenseData(expenseRange, true);
        await fetchSleepEmotionData(sleepEmotionRange, true);
        await fetchDayEmotionData(dayEmotionRange, true);
        await fetchHabitImpactData(habitImpactRange, true);
        await fetchHabits(true);
      } finally {
        setPageLoading(false);
        hasInitialized.current = true;
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchLifeData(lifeAverageRange);
  }, [lifeAverageRange]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchMoodData(moodBarRange, setMoodBarData, setMoodBarLoading);
  }, [moodBarRange]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchMoodData(moodLineRange, setMoodLineData, setMoodLineLoading);
  }, [moodLineRange]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchMoodData(moodPieRange, setMoodPieData, setMoodPieLoading);
  }, [moodPieRange]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchTimeData(timeRange);
  }, [timeRange]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchExpenseData(expenseRange);
  }, [expenseRange]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchSleepEmotionData(sleepEmotionRange);
  }, [sleepEmotionRange]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchDayEmotionData(dayEmotionRange);
  }, [dayEmotionRange]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchHabitImpactData(habitImpactRange);
  }, [habitImpactRange]);

  const buildLifeRadarData = (averages) => [
    { subject: "Health", A: averages?.health ?? 0, fullMark: 10 },
    { subject: "Finances", A: averages?.finances ?? 0, fullMark: 10 },
    { subject: "Career", A: averages?.career ?? 0, fullMark: 10 },
    { subject: "Partner", A: averages?.partner ?? 0, fullMark: 10 },
    { subject: "Family", A: averages?.familyFriends ?? 0, fullMark: 10 },
    {
      subject: "Environment",
      A: averages?.physicalEnvironment ?? 0,
      fullMark: 10,
    },
    { subject: "Fun", A: averages?.funRecreation ?? 0, fullMark: 10 },
    { subject: "Growth", A: averages?.personalGrowth ?? 0, fullMark: 10 },
  ];

  const fetchLifeData = async (range, isInitial = false) => {
    setLifeLoading(true);
    if (!isInitial) {
      setError("");
    }
    try {
      const { data: lifeJson } = await api.get(
        `/life-ratings/average/${range}`,
      );
      if (lifeJson?.averages) {
        setLifeData(buildLifeRadarData(lifeJson.averages));
      } else {
        setLifeData([]);
      }
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError(
        "Unable to connect to the intelligence engine. Please check your connection.",
      );
    } finally {
      setLifeLoading(false);
    }
  };

  const fetchMoodData = async (
    range,
    setData,
    setLoading,
    isInitial = false,
  ) => {
    setLoading(true);
    if (!isInitial) {
      setError("");
    }
    try {
      const { data: emoJson } = await api.get(`/emotions/range/${range}`);
      const moodLabelOptions =
        range === "week"
          ? { weekday: "short" }
          : { month: "short", day: "numeric" };
      const formattedMoods = emoJson.emotions.map((e) => ({
        date: new Date(e.date).toLocaleDateString(undefined, {
          ...moodLabelOptions,
        }),
        score: EMOTION_SCORES[e.emotion] || 3,
        emotion: e.emotion,
      }));
      setData(formattedMoods);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError(
        "Unable to connect to the intelligence engine. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeData = async (range, isInitial = false) => {
    setTimeLoading(true);
    if (!isInitial) {
      setError("");
    }
    try {
      const timeLimit = range === "year" ? 365 : range === "month" ? 30 : 7;
      const timeLabelOptions =
        range === "week"
          ? { weekday: "short" }
          : { month: "short", day: "numeric" };
      const { data: timeJson } = await api.get("/time-tracker", {
        params: { limit: timeLimit },
      });
      const formattedTime = timeJson.entries.map((e) => ({
        name: new Date(e.date).toLocaleDateString(undefined, {
          ...timeLabelOptions,
        }),
        Sleep: e.sleep || 0,
        Work: e.workStudy || 0,
        Screen: e.screen || 0,
      }));
      setTimeData(formattedTime);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError(
        "Unable to connect to the intelligence engine. Please check your connection.",
      );
    } finally {
      setTimeLoading(false);
    }
  };

  const fetchSleepEmotionData = async (range, isInitial = false) => {
    setSleepEmotionLoading(true);
    if (!isInitial) {
      setError("");
    }
    try {
      const timeLimit = range === "year" ? 365 : range === "month" ? 30 : 7;
      const labelOptions =
        range === "week"
          ? { weekday: "short" }
          : { month: "short", day: "numeric" };
      const { data: timeJson } = await api.get("/time-tracker", {
        params: { limit: timeLimit },
      });
      const { data: emotionJson } = await api.get(`/emotions/range/${range}`);

      const emotionMap = new Map(
        (emotionJson.emotions || []).map((entry) => [
          toDateKey(entry.date),
          entry.emotion,
        ]),
      );

      const merged = (timeJson.entries || []).reduce((acc, entry) => {
        const key = toDateKey(entry.date);
        const emotion = emotionMap.get(key);
        if (!emotion) return acc;
        const sleep = Number(entry.sleep || 0);
        const screen = Number(entry.screen || 0);
        const workStudy = Number(entry.workStudy || 0);
        if (!Number.isFinite(sleep)) return acc;
        acc.push({
          sleep,
          screen,
          workStudy,
          emotionScore: EMOTION_SCORES[emotion] || 3,
          emotion,
          label: new Date(entry.date).toLocaleDateString(undefined, {
            ...labelOptions,
          }),
        });
        return acc;
      }, []);

      setSleepEmotionData(merged);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError(
        "Unable to connect to the intelligence engine. Please check your connection.",
      );
      setSleepEmotionData([]);
    } finally {
      setSleepEmotionLoading(false);
    }
  };

  const fetchDayEmotionData = async (range, isInitial = false) => {
    setDayEmotionLoading(true);
    if (!isInitial) {
      setError("");
    }
    try {
      const { data: emotionJson } = await api.get(`/emotions/range/${range}`);
      const buckets = new Map(
        WEEKDAY_ORDER.map((day) => [day, { counts: {}, total: 0 }]),
      );

      (emotionJson.emotions || []).forEach((entry) => {
        const dayKey = new Date(entry.date).toLocaleDateString("en-US", {
          weekday: "short",
        });
        if (!buckets.has(dayKey)) return;
        const bucket = buckets.get(dayKey);
        bucket.counts[entry.emotion] = (bucket.counts[entry.emotion] || 0) + 1;
        bucket.total += 1;
      });

      const aggregated = WEEKDAY_ORDER.map((day) => {
        const bucket = buckets.get(day);
        if (!bucket || bucket.total === 0) {
          return {
            day,
            emotion: "none",
            emotionLabel: "No data",
            score: 0,
            count: 0,
            total: 0,
          };
        }

        const counts = bucket.counts;
        const maxCount = Math.max(...Object.values(counts));
        const topEmotions = Object.keys(counts).filter(
          (emotion) => counts[emotion] === maxCount,
        );
        const isMixed = topEmotions.length > 1;
        const emotion = isMixed ? "mixed" : topEmotions[0];
        const score = isMixed
          ? topEmotions.reduce(
              (sum, emo) => sum + (EMOTION_SCORES[emo] || 3),
              0,
            ) / topEmotions.length
          : EMOTION_SCORES[emotion] || 3;
        const emotionLabel = isMixed ? "Mixed" : formatEmotionName(emotion);

        return {
          day,
          emotion,
          emotionLabel,
          score,
          count: maxCount,
          total: bucket.total,
        };
      });

      setDayEmotionData(aggregated);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError(
        "Unable to connect to the intelligence engine. Please check your connection.",
      );
      setDayEmotionData([]);
    } finally {
      setDayEmotionLoading(false);
    }
  };

  const fetchHabitImpactData = async (range, isInitial = false) => {
    setHabitImpactLoading(true);
    if (!isInitial) {
      setError("");
    }
    try {
      const { from, to, days } = getRangeWindow(range);
      const fromKey = toDateKey(from);
      const toKey = toDateKey(to);
      const { data: ratingsJson } = await api.get(
        `/life-ratings/range?from=${fromKey}&to=${toKey}&limit=${days}`,
      );
      const { data: habitsJson } = await api.get("/habits");

      const entries = ratingsJson.entries || [];
      const habitsList = habitsJson.habits || [];
      if (entries.length === 0 || habitsList.length === 0) {
        setHabitImpactData([]);
        return;
      }

      const ratingByDate = new Map();
      entries.forEach((entry) => {
        ratingByDate.set(toDateKey(entry.date), entry.ratings || {});
      });

      const baseline = LIFE_RATING_FIELDS.reduce((acc, field) => {
        const values = entries
          .map((entry) => entry.ratings?.[field.key])
          .filter((value) => Number.isFinite(value));
        acc[field.key] = values.length
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : null;
        return acc;
      }, {});

      const impacts = [];
      habitsList.forEach((habit) => {
        const completedSet = new Set(
          (habit.history || [])
            .filter((entry) => entry.completed)
            .map((entry) => toDateKey(entry.date)),
        );

        LIFE_RATING_FIELDS.forEach((field) => {
          const withValues = [];
          const withoutValues = [];

          ratingByDate.forEach((ratings, dateKey) => {
            const value = ratings?.[field.key];
            if (!Number.isFinite(value)) return;
            if (completedSet.has(dateKey)) {
              withValues.push(value);
            } else {
              withoutValues.push(value);
            }
          });

          if (
            withValues.length < HABIT_IMPACT_MIN_SAMPLES ||
            withoutValues.length < HABIT_IMPACT_MIN_SAMPLES
          ) {
            return;
          }

          const avgWith =
            withValues.reduce((sum, v) => sum + v, 0) / withValues.length;
          const avgWithout =
            withoutValues.reduce((sum, v) => sum + v, 0) / withoutValues.length;
          const impact = avgWith - avgWithout;

          if (Math.abs(impact) < HABIT_IMPACT_THRESHOLD) {
            return;
          }

          impacts.push({
            habitId: habit._id,
            habitName: habit.name,
            ratingKey: field.key,
            ratingLabel: field.label,
            impact,
            avgWith,
            avgWithout,
            baseline: baseline[field.key],
            countWith: withValues.length,
            countWithout: withoutValues.length,
          });
        });
      });

      impacts.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
      setHabitImpactData(impacts);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError(
        "Unable to connect to the intelligence engine. Please check your connection.",
      );
      setHabitImpactData([]);
    } finally {
      setHabitImpactLoading(false);
    }
  };

  const fetchExpenseData = async (range, isInitial = false) => {
    setExpenseLoading(true);
    if (!isInitial) {
      setError("");
    }
    try {
      const expenseLimit = range === "year" ? 365 : range === "month" ? 30 : 7;
      const expenseLabelOptions =
        range === "week"
          ? { weekday: "short" }
          : { month: "short", day: "numeric" };
      const { data: expenseJson } = await api.get("/time-tracker", {
        params: { limit: expenseLimit },
      });
      const formattedExpense = expenseJson.entries.map((e) => ({
        name: new Date(e.date).toLocaleDateString(undefined, {
          ...expenseLabelOptions,
        }),
        Expense: e.expense || 0,
      }));
      setExpenseData(formattedExpense);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError(
        "Unable to connect to the intelligence engine. Please check your connection.",
      );
    } finally {
      setExpenseLoading(false);
    }
  };

  const fetchHabits = async (isInitial = false) => {
    if (!isInitial) {
      setError("");
    }
    try {
      const { data: habitsJson } = await api.get("/habits");
      setHabits(habitsJson.habits);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError(
        "Unable to connect to the intelligence engine. Please check your connection.",
      );
    }
  };

  const avgMood = useMemo(() => {
    if (moodBarData.length === 0) return "Neutral";
    const sum = moodBarData.reduce((acc, curr) => acc + curr.score, 0);
    const avg = sum / moodBarData.length;
    if (avg >= 4) return "Positive";
    if (avg >= 2.5) return "Stable";
    return "Volatile";
  }, [moodBarData]);

  const moodRangeLabel = useMemo(() => {
    if (moodBarRange === "week") return "last 7d";
    if (moodBarRange === "year") return "last 365d";
    return "last 30d";
  }, [moodBarRange]);

  const emotionDistribution = useMemo(() => {
    if (moodPieData.length === 0) return [];
    const counts = moodPieData.reduce((acc, curr) => {
      const key = curr.emotion || "neutral";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([emotion, value]) => ({
        name: `${emotion[0].toUpperCase()}${emotion.slice(1)}`,
        value,
        color: EMOTION_COLORS[emotion] || "#f472b6",
      }))
      .sort((a, b) => b.value - a.value);
  }, [moodPieData]);

  const insightMetricLabel =
    insightMetric === "screen"
      ? "Screen"
      : insightMetric === "workStudy"
        ? "Work/Study"
        : "Sleep";

  const insightPlotData = useMemo(
    () =>
      sleepEmotionData.map((entry) => ({
        x: entry[insightMetric] ?? 0,
        emotionScore: entry.emotionScore,
        emotion: entry.emotion,
        label: entry.label,
      })),
    [sleepEmotionData, insightMetric],
  );

  const insightLineData = useMemo(
    () => [...insightPlotData].sort((a, b) => a.x - b.x),
    [insightPlotData],
  );

  const insightSummary = useMemo(() => {
    const valid = insightPlotData
      .filter(
        (entry) =>
          Number.isFinite(entry.x) && Number.isFinite(entry.emotionScore),
      )
      .sort((a, b) => a.x - b.x);

    if (valid.length < 4) {
      return `Log more ${insightMetricLabel.toLowerCase()} data to unlock insights.`;
    }

    const bandSize = Math.max(2, Math.floor(valid.length * 0.3));
    const lowBand = valid.slice(0, bandSize);
    const highBand = valid.slice(valid.length - bandSize);

    const avg = (items) =>
      items.reduce((sum, item) => sum + item.emotionScore, 0) / items.length;
    const lowAvg = avg(lowBand);
    const highAvg = avg(highBand);
    const diff = highAvg - lowAvg;

    if (Math.abs(diff) < 0.25) {
      return `No clear emotional shift between low and high ${insightMetricLabel.toLowerCase()} days.`;
    }

    const higherLabel = getNearestEmotionLabel(highAvg).toLowerCase();
    const lowerLabel = getNearestEmotionLabel(lowAvg).toLowerCase();
    if (diff > 0) {
      return `Higher ${insightMetricLabel.toLowerCase()} days align with more ${higherLabel} emotions.`;
    }
    return `Lower ${insightMetricLabel.toLowerCase()} days align with more ${lowerLabel} emotions.`;
  }, [insightPlotData, insightMetricLabel]);

  const insightStrength = useMemo(() => {
    const valid = insightPlotData
      .filter(
        (entry) =>
          Number.isFinite(entry.x) && Number.isFinite(entry.emotionScore),
      )
      .map((entry) => ({ x: entry.x, y: entry.emotionScore }));

    if (valid.length < 4) {
      return `Not enough ${insightMetricLabel.toLowerCase()} data to assess strength.`;
    }

    const mean = (items, key) =>
      items.reduce((sum, item) => sum + item[key], 0) / items.length;
    const meanX = mean(valid, "x");
    const meanY = mean(valid, "y");

    let num = 0;
    let denX = 0;
    let denY = 0;
    for (const item of valid) {
      const dx = item.x - meanX;
      const dy = item.y - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const denom = Math.sqrt(denX * denY);
    if (!denom) {
      return `Not enough ${insightMetricLabel.toLowerCase()} variance to assess strength.`;
    }

    const r = num / denom;
    const absR = Math.abs(r);
    const strength = absR >= 0.5 ? "strong" : absR >= 0.3 ? "moderate" : "weak";
    const direction = r >= 0 ? "positive" : "negative";

    return `Overall correlation looks ${strength} and ${direction}.`;
  }, [insightPlotData, insightMetricLabel]);

  const dayEmotionInsight = useMemo(() => {
    if (dayEmotionData.length === 0) {
      return "Log emotions to see weekly patterns.";
    }

    const bestDay = dayEmotionData.reduce((prev, current) =>
      current.count > prev.count ? current : prev,
    );
    if (!bestDay || bestDay.count === 0) {
      return "Log more emotions to reveal your weekly patterns.";
    }

    const dayLabel = WEEKDAY_FULL[bestDay.day] || bestDay.day;
    if (bestDay.emotion === "mixed") {
      return `Your emotions are most mixed on ${dayLabel}.`;
    }
    return `You tend to feel more ${bestDay.emotionLabel.toLowerCase()} on ${dayLabel}.`;
  }, [dayEmotionData]);

  const habitImpactTop = useMemo(
    () => habitImpactData.slice(0, 8),
    [habitImpactData],
  );

  const habitImpactInsights = useMemo(() => {
    if (habitImpactData.length === 0) {
      return ["Log habits and life ratings to unlock impact insights."];
    }
    const positives = habitImpactData
      .filter((item) => item.impact > 0)
      .slice(0, 2);
    const negatives = habitImpactData
      .filter((item) => item.impact < 0)
      .slice(0, 2);

    const formatImpact = (item) => {
      const baseline = Number.isFinite(item.baseline)
        ? item.baseline.toFixed(1)
        : "—";
      const avg = item.avgWith.toFixed(1);
      const delta = Math.abs(item.impact).toFixed(1);
      if (item.impact > 0) {
        return `On days you do ${item.habitName}, ${item.ratingLabel} averages ${avg} vs baseline ${baseline} (+${delta}).`;
      }
      return `On days you do ${item.habitName}, ${item.ratingLabel} averages ${avg} vs baseline ${baseline} (-${delta}).`;
    };

    return [...positives, ...negatives].map(formatImpact);
  }, [habitImpactData]);

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
  const formatCurrency = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return value;

    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: expenseCurrency,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (err) {
      return `${expenseCurrency} ${amount}`;
    }
  };

  const expenseInsight = useMemo(() => {
    if (expenseData.length < 3) {
      return "Log a few more expense entries to unlock insights.";
    }

    const values = expenseData
      .map((item) => Number(item.Expense))
      .filter((value) => Number.isFinite(value));

    if (values.length < 3) {
      return "Log a few more expense entries to unlock insights.";
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    const average = total / values.length;
    const last = values[values.length - 1];
    const prevAvg =
      values.length > 1
        ? values.slice(0, -1).reduce((sum, value) => sum + value, 0) /
          (values.length - 1)
        : average;
    const delta = last - prevAvg;
    const deltaAbs = Math.abs(delta);
    const peak = Math.max(...values);
    const peakIndex = values.indexOf(peak);
    const peakLabel = expenseData[peakIndex]?.name || "the peak day";

    const rangeLabel =
      expenseRange === "week"
        ? "last 7 days"
        : expenseRange === "year"
          ? "last 365 days"
          : "last 30 days";

    const avgText = `Average daily spend is ${formatCurrency(average)} over the ${rangeLabel}.`;

    if (deltaAbs < Math.max(average * 0.08, 5)) {
      return `${avgText} Spending is steady, with a peak on ${peakLabel}.`;
    }

    if (delta > 0) {
      return `${avgText} Latest spend is ${formatCurrency(deltaAbs)} above your recent average, with a peak on ${peakLabel}.`;
    }

    return `${avgText} Latest spend is ${formatCurrency(deltaAbs)} below your recent average, with a peak on ${peakLabel}.`;
  }, [expenseData, expenseRange, formatCurrency]);

  const timeInsight = useMemo(() => {
    if (timeData.length < 3) {
      return "Log a few more time entries to unlock insights.";
    }

    const rows = timeData
      .map((item) => ({
        sleep: Number(item.Sleep),
        work: Number(item.Work),
        screen: Number(item.Screen),
      }))
      .filter(
        (item) =>
          Number.isFinite(item.sleep) &&
          Number.isFinite(item.work) &&
          Number.isFinite(item.screen),
      );

    if (rows.length < 3) {
      return "Log a few more time entries to unlock insights.";
    }

    const totals = rows.reduce(
      (acc, item) => {
        acc.sleep += item.sleep;
        acc.work += item.work;
        acc.screen += item.screen;
        return acc;
      },
      { sleep: 0, work: 0, screen: 0 },
    );

    const avgSleep = totals.sleep / rows.length;
    const avgWork = totals.work / rows.length;
    const avgScreen = totals.screen / rows.length;

    const dominant = [
      { label: "Sleep", value: avgSleep },
      { label: "Work/Study", value: avgWork },
      { label: "Screen", value: avgScreen },
    ].sort((a, b) => b.value - a.value)[0];

    const rangeLabel =
      timeRange === "week"
        ? "last 7 days"
        : timeRange === "year"
          ? "last 365 days"
          : "last 30 days";

    const sleepNote =
      avgSleep < 6
        ? " Sleep averages below 6h."
        : avgSleep > 9
          ? " Sleep averages above 9h."
          : "";
    const screenWorkGap = avgScreen - avgWork;
    const balanceNote =
      Math.abs(screenWorkGap) >= 1.5
        ? ` Screen time is ${screenWorkGap > 0 ? "higher" : "lower"} than work/study by ~${Math.abs(screenWorkGap).toFixed(1)}h.`
        : "";

    return `Average daily time in the ${rangeLabel}: ${avgSleep.toFixed(1)}h sleep, ${avgWork.toFixed(1)}h work/study, ${avgScreen.toFixed(1)}h screen. ${dominant.label} is highest.${sleepNote}${balanceNote}`;
  }, [timeData, timeRange]);

  const topHabit = useMemo(() => {
    if (habits.length === 0) return null;
    return habits.reduce((prev, current) =>
      prev.currentStreak > current.currentStreak ? prev : current,
    );
  }, [habits]);

  const topHabitMilestones = useMemo(() => {
    if (!topHabit) return [];
    return getStreakMilestones(topHabit.currentStreak);
  }, [topHabit]);

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-mono text-sm tracking-widest animate-pulse uppercase">
            Analysing life patterns...
          </p>
        </div>
      </div>
    );
  }

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
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-[10px] font-mono tracking-widest uppercase mb-4">
                <BrainCircuit className="w-3.5 h-3.5" />
                Behavioural Insights
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                Life Intelligence.
              </h1>
              <p className="text-slate-400 max-w-2xl text-base">
                Visualising the correlations between your habits, emotions, and
                objective daily metrics.
              </p>
            </motion.header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-pink-500/25 bg-gradient-to-br from-pink-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl group hover:border-pink-400/50 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                      Emotional State
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {avgMood}
                      </span>
                      <span className="text-xs text-slate-500">
                        {moodRangeLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-2">
                      <ArrowUpRight className="w-3 h-3" /> Stabilising
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-emerald-500/25 bg-gradient-to-br from-emerald-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl group hover:border-emerald-400/50 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                      Consistency Peak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topHabit ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-white">
                            {topHabit.currentStreak}d
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-[100px]">
                            {topHabit.name}
                          </span>
                        </div>
                        {topHabitMilestones.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {topHabitMilestones.map((milestone) => (
                              <span
                                key={milestone}
                                className="inline-flex items-center rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-pink-200"
                              >
                                {milestone}d badge
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-pink-400 mt-2">
                          <TrendingUp className="w-3 h-3" /> New record
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-500 text-sm italic">
                        No habit data
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-indigo-500/25 bg-gradient-to-br from-indigo-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl group hover:border-indigo-400/50 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                      Life Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">
                        {lifeData.length > 0
                          ? (
                              lifeData.reduce((acc, c) => acc + c.A, 0) / 8
                            ).toFixed(1)
                          : "—"}
                      </span>
                      <span className="text-xs text-slate-500">/ 10.0</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                      <Star className="w-3 h-3 text-amber-500" /> Balanced
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Mood Trend Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl overflow-hidden min-h-[420px]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-pink-500" />
                      Mood Dynamics
                    </CardTitle>
                    <CardDescription>
                      Fluctuations in your reported emotional state over time.
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["week", "month", "year"].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setMoodBarRange(range)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                            moodBarRange === range
                              ? "border-pink-400/60 bg-pink-400/10 text-pink-200"
                              : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px] w-full pr-6">
                    {moodBarLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-2 border-pink-400/40 border-t-pink-400 animate-spin" />
                      </div>
                    ) : moodBarData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={moodBarData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff10"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            domain={[1, 5]}
                            ticks={[1, 1.5, 2, 2.5, 3, 3.5, 4, 5]}
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatEmotionLabel}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderRadius: "12px",
                              border: "1px solid #ffffff10",
                              fontSize: "10px",
                            }}
                            itemStyle={{ color: "#f472b6" }}
                            formatter={(value) => [
                              formatEmotionLabel(value),
                              "Emotion",
                            ]}
                          />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                            {moodBarData.map((entry) => (
                              <Cell
                                key={`bar-${entry.date}`}
                                fill={
                                  EMOTION_COLORS[entry.emotion] || "#ec4899"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                        Log more emotions to see trends
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Emotion Over Time Line Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl overflow-hidden min-h-[420px]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-indigo-400" />
                      Emotion Over Time
                    </CardTitle>
                    <CardDescription>
                      Timeline view of your daily emotion entries.
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["week", "month", "year"].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setMoodLineRange(range)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                            moodLineRange === range
                              ? "border-indigo-400/60 bg-indigo-400/10 text-indigo-200"
                              : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px] w-full pr-6">
                    {moodLineLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-2 border-indigo-400/40 border-t-indigo-400 animate-spin" />
                      </div>
                    ) : moodLineData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={moodLineData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff10"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            domain={[1, 5]}
                            ticks={[1, 1.5, 2, 2.5, 3, 3.5, 4, 5]}
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={formatEmotionLabel}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderRadius: "12px",
                              border: "1px solid #ffffff10",
                              fontSize: "10px",
                            }}
                            formatter={(value) => [
                              formatEmotionLabel(value),
                              "Emotion",
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#64748b"
                            strokeWidth={3}
                            dot={({ cx, cy, payload }) => (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={4}
                                fill={
                                  EMOTION_COLORS[payload?.emotion] || "#818cf8"
                                }
                                stroke="#0f172a"
                                strokeWidth={1}
                              />
                            )}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                        Log more emotions to see the timeline
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Emotion Distribution Pie Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl overflow-hidden min-h-[420px]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      Emotion Distribution
                    </CardTitle>
                    <CardDescription>
                      Breakdown of emotions logged in this period.
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["week", "month", "year"].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setMoodPieRange(range)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                            moodPieRange === range
                              ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                              : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px] w-full">
                    {moodPieLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-2 border-cyan-400/40 border-t-cyan-400 animate-spin" />
                      </div>
                    ) : emotionDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderRadius: "12px",
                              border: "1px solid #ffffff10",
                              fontSize: "10px",
                            }}
                            formatter={(value) => [value, "Days"]}
                          />
                          <Legend
                            wrapperStyle={{
                              paddingTop: "12px",
                              fontSize: "10px",
                            }}
                          />
                          <Pie
                            data={emotionDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                          >
                            {emotionDistribution.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                        Log more emotions to see distribution
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Wheel of Life Radar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-amber-500/25 bg-gradient-to-br from-amber-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl overflow-hidden min-h-[420px]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-400" />
                      Life Balance
                    </CardTitle>
                    <CardDescription>
                      Visualisation of your current life domain ratings.
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["week", "month", "year"].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setLifeAverageRange(range)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                            lifeAverageRange === range
                              ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
                              : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px] w-full">
                    {lifeLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin" />
                      </div>
                    ) : lifeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="80%"
                          data={lifeData}
                        >
                          <PolarGrid stroke="#ffffff10" />
                          <PolarAngleAxis
                            dataKey="subject"
                            stroke="#64748b"
                            fontSize={10}
                          />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} hide />
                          <Radar
                            name="Satisfaction"
                            dataKey="A"
                            stroke="#f59e0b"
                            fill="#f59e0b"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                        Submit Life Ratings to view balance
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Insight Engine */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Insight Engine
                    </p>
                    <p className="text-sm text-slate-300">
                      Correlations surfaced from your daily logs.
                    </p>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl overflow-hidden min-h-[420px]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Moon className="h-5 w-5 text-violet-400" />
                        {insightMetricLabel} vs Emotion
                      </CardTitle>
                      <CardDescription>
                        Correlation between {insightMetricLabel.toLowerCase()}{" "}
                        hours and your emotion score.
                      </CardDescription>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {[
                          { key: "week", label: "week" },
                          { key: "month", label: "month" },
                          { key: "year", label: "year" },
                        ].map((range) => (
                          <button
                            key={range.key}
                            type="button"
                            onClick={() => setSleepEmotionRange(range.key)}
                            className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                              sleepEmotionRange === range.key
                                ? "border-violet-400/60 bg-violet-400/10 text-violet-200"
                                : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                        <div className="ml-auto flex items-center gap-2">
                          {[
                            { key: "scatter", label: "Scatter" },
                            { key: "line", label: "Line" },
                          ].map((view) => (
                            <button
                              key={view.key}
                              type="button"
                              onClick={() => setSleepEmotionView(view.key)}
                              className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                                sleepEmotionView === view.key
                                  ? "border-white/40 bg-white/10 text-white"
                                  : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                              }`}
                            >
                              {view.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { key: "sleep", label: "Sleep" },
                          { key: "screen", label: "Screen" },
                          { key: "workStudy", label: "Work/Study" },
                        ].map((metric) => (
                          <button
                            key={metric.key}
                            type="button"
                            onClick={() => setInsightMetric(metric.key)}
                            className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                              insightMetric === metric.key
                                ? "border-white/40 bg-white/10 text-white"
                                : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                            }`}
                          >
                            {metric.label}
                          </button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                      {sleepEmotionLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full border-2 border-violet-400/40 border-t-violet-400 animate-spin" />
                        </div>
                      ) : insightPlotData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          {sleepEmotionView === "scatter" ? (
                            <ScatterChart
                              margin={{
                                top: 20,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#ffffff10"
                                vertical={false}
                              />
                              <XAxis
                                type="number"
                                dataKey="x"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                unit="h"
                              />
                              <YAxis
                                type="number"
                                dataKey="emotionScore"
                                domain={[1, 5]}
                                ticks={[1, 1.5, 2, 2.5, 3, 3.5, 4, 5]}
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatEmotionLabel}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#0f172a",
                                  borderRadius: "12px",
                                  border: "1px solid #ffffff10",
                                  fontSize: "10px",
                                }}
                                formatter={(value, name, payload) => {
                                  if (name === "emotionScore") {
                                    return [
                                      formatEmotionLabel(value),
                                      "Emotion",
                                    ];
                                  }
                                  if (name === "x") {
                                    return [`${value}h`, insightMetricLabel];
                                  }
                                  return [value, name];
                                }}
                                labelFormatter={(_, payload) =>
                                  payload?.[0]?.payload?.label || ""
                                }
                              />
                              <Scatter data={insightPlotData} fill="#a78bfa" />
                            </ScatterChart>
                          ) : (
                            <LineChart data={insightLineData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#ffffff10"
                                vertical={false}
                              />
                              <XAxis
                                type="number"
                                dataKey="x"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                unit="h"
                              />
                              <YAxis
                                type="number"
                                domain={[1, 5]}
                                ticks={[1, 1.5, 2, 2.5, 3, 3.5, 4, 5]}
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatEmotionLabel}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#0f172a",
                                  borderRadius: "12px",
                                  border: "1px solid #ffffff10",
                                  fontSize: "10px",
                                }}
                                formatter={(value, name, payload) => {
                                  if (name === "emotionScore") {
                                    return [
                                      formatEmotionLabel(value),
                                      "Emotion",
                                    ];
                                  }
                                  if (name === "x") {
                                    return [`${value}h`, insightMetricLabel];
                                  }
                                  return [value, name];
                                }}
                                labelFormatter={(_, payload) =>
                                  payload?.[0]?.payload?.label || ""
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey="emotionScore"
                                stroke="#a78bfa"
                                strokeWidth={3}
                                dot={{ r: 3 }}
                              />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                          Log sleep and emotions to see the correlation
                        </div>
                      )}
                    </CardContent>
                    <div className="px-6 pb-6 text-xs text-slate-400 space-y-2">
                      <p>{insightSummary}</p>
                      <p>{insightStrength}</p>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6"
                >
                  <Card className="border-slate-500/20 bg-gradient-to-br from-slate-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl overflow-hidden min-h-[360px]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-slate-300" />
                        Day vs Emotion
                      </CardTitle>
                      <CardDescription>
                        Dominant emotion patterns by day of the week.
                      </CardDescription>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { key: "week", label: "week" },
                          { key: "month", label: "month" },
                          { key: "year", label: "year" },
                        ].map((range) => (
                          <button
                            key={range.key}
                            type="button"
                            onClick={() => setDayEmotionRange(range.key)}
                            className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                              dayEmotionRange === range.key
                                ? "border-slate-300/60 bg-slate-300/10 text-slate-100"
                                : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="h-[240px] w-full">
                      {dayEmotionLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full border-2 border-slate-400/40 border-t-slate-300 animate-spin" />
                        </div>
                      ) : dayEmotionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dayEmotionData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff10"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="day"
                              stroke="#64748b"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              domain={[0, 5]}
                              ticks={[1, 2, 3, 4, 5]}
                              stroke="#64748b"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={formatEmotionLabel}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                borderRadius: "12px",
                                border: "1px solid #ffffff10",
                                fontSize: "10px",
                              }}
                              formatter={(value, name, payload) => {
                                const row = payload?.payload;
                                if (!row || row.total === 0) {
                                  return ["No data", "Emotion"];
                                }
                                return [
                                  `${row.emotionLabel} (${row.count})`,
                                  "Dominant",
                                ];
                              }}
                            />
                            <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                              {dayEmotionData.map((entry) => (
                                <Cell
                                  key={entry.day}
                                  fill={
                                    entry.emotion === "mixed"
                                      ? "#94a3b8"
                                      : EMOTION_COLORS[entry.emotion] ||
                                        "#94a3b8"
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                          Log emotions to see day patterns
                        </div>
                      )}
                    </CardContent>
                    <div className="px-6 pb-6 text-xs text-slate-400">
                      {dayEmotionInsight}
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="mt-6"
                >
                  <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl overflow-hidden min-h-[360px]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                        Habit Impact Engine
                      </CardTitle>
                      <CardDescription>
                        Habits correlated with your life ratings.
                      </CardDescription>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { key: "week", label: "week" },
                          { key: "month", label: "month" },
                          { key: "year", label: "year" },
                        ].map((range) => (
                          <button
                            key={range.key}
                            type="button"
                            onClick={() => setHabitImpactRange(range.key)}
                            className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                              habitImpactRange === range.key
                                ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
                                : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent className="h-[220px] w-full">
                      {habitImpactLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full border-2 border-emerald-400/40 border-t-emerald-400 animate-spin" />
                        </div>
                      ) : habitImpactTop.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={habitImpactTop} layout="vertical">
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff10"
                              horizontal={false}
                            />
                            <XAxis
                              type="number"
                              stroke="#64748b"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="habitName"
                              stroke="#64748b"
                              fontSize={10}
                              width={90}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f172a",
                                borderRadius: "12px",
                                border: "1px solid #ffffff10",
                                fontSize: "10px",
                              }}
                              formatter={(value, name, payload) => {
                                const row = payload?.payload;
                                if (!row) return [value, "Impact"];
                                const delta = Number(value).toFixed(2);
                                return [
                                  `${delta} on ${row.ratingLabel}`,
                                  "Impact",
                                ];
                              }}
                            />
                            <Bar dataKey="impact" radius={[6, 6, 6, 6]}>
                              {habitImpactTop.map((entry) => (
                                <Cell
                                  key={`${entry.habitId}-${entry.ratingKey}`}
                                  fill={
                                    entry.impact >= 0 ? "#34d399" : "#f87171"
                                  }
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                          Log habits and life ratings to see impacts
                        </div>
                      )}
                    </CardContent>
                    <div className="px-6 pb-6 text-xs text-slate-400 space-y-2">
                      {habitImpactInsights.map((insight) => (
                        <p key={insight}>{insight}</p>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Time Tracker Composition Chart */}
              <motion.div
                id="time-allocation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="lg:col-span-2"
              >
                <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl overflow-hidden min-h-[420px]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock3 className="h-5 w-5 text-emerald-400" />
                      Time Allocation
                    </CardTitle>
                    <CardDescription>
                      Comparison of Sleep, Screen, and Work/Study time over the
                      selected range.
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["week", "month", "year"].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setTimeRange(range)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                            timeRange === range
                              ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
                              : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px] w-full">
                    {timeLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-2 border-emerald-400/40 border-t-emerald-400 animate-spin" />
                      </div>
                    ) : timeData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={timeData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff10"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "#ffffff05" }}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderRadius: "12px",
                              border: "1px solid #ffffff10",
                            }}
                          />
                          <Legend
                            wrapperStyle={{
                              paddingTop: "20px",
                              fontSize: "10px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="Sleep"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="Work"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="Screen"
                            stroke="#ef4444"
                            strokeWidth={3}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                        Log data in the Track page to see time allocation
                      </div>
                    )}
                  </CardContent>
                  <div className="px-6 pb-5 text-xs font-mono text-emerald-200/80">
                    {timeInsight}
                  </div>
                </Card>
              </motion.div>

              {/* Expense Tracker Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="lg:col-span-2"
              >
                <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 via-slate-900/70 to-slate-950/95 backdrop-blur-xl overflow-hidden min-h-[420px]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-amber-400" />
                      Expense Tracker
                    </CardTitle>
                    <CardDescription>
                      Daily expenses logged in the selected range (
                      {expenseSymbol} {expenseCurrency}).
                    </CardDescription>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["week", "month", "year"].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setExpenseRange(range)}
                          className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all ${
                            expenseRange === range
                              ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
                              : "border-white/10 text-slate-400 hover:border-white/30 hover:text-slate-200"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="h-[300px] w-full">
                    {expenseLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin" />
                      </div>
                    ) : expenseData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={expenseData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#ffffff10"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "#ffffff05" }}
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderRadius: "12px",
                              border: "1px solid #ffffff10",
                            }}
                            formatter={(value) => [
                              formatCurrency(value),
                              "Expense",
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="Expense"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                        Log expenses in Track to see trends
                      </div>
                    )}
                  </CardContent>
                  <div className="px-6 pb-5 text-xs font-mono text-amber-200/80">
                    {expenseInsight}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      <MobileTabBar items={navItems} />
    </div>
  );
}
