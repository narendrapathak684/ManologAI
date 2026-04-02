import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  Star,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  User,
  X,
  Menu,
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

export default function AnalyticsPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [lifeData, setLifeData] = useState([]);
  const [moodData, setMoodData] = useState([]);
  const [timeData, setTimeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [habits, setHabits] = useState([]);
  const [lifeLoading, setLifeLoading] = useState(false);
  const [timeLoading, setTimeLoading] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [error, setError] = useState("");
  const [lifeAverageRange, setLifeAverageRange] = useState("month");
  const [timeRange, setTimeRange] = useState("week");
  const [expenseRange, setExpenseRange] = useState("week");
  const { user } = useAuth();
  const hasInitialized = useRef(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      setError("");
      try {
        await Promise.all([
          fetchLifeData(lifeAverageRange, true),
          fetchMoodData(true),
          fetchTimeData(timeRange, true),
          fetchExpenseData(expenseRange, true),
          fetchHabits(true),
        ]);
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
    fetchTimeData(timeRange);
  }, [timeRange]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    fetchExpenseData(expenseRange);
  }, [expenseRange]);

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

  const fetchMoodData = async (isInitial = false) => {
    if (!isInitial) {
      setError("");
    }
    try {
      const { data: emoJson } = await api.get("/emotions/month");
      const formattedMoods = emoJson.emotions.map((e) => ({
        date: new Date(e.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        score: EMOTION_SCORES[e.emotion] || 3,
        emotion: e.emotion,
      }));
      setMoodData(formattedMoods);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
      setError(
        "Unable to connect to the intelligence engine. Please check your connection.",
      );
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
    if (moodData.length === 0) return "Neutral";
    const sum = moodData.reduce((acc, curr) => acc + curr.score, 0);
    const avg = sum / moodData.length;
    if (avg >= 4) return "Positive";
    if (avg >= 2.5) return "Stable";
    return "Volatile";
  }, [moodData]);

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

  const topHabit = useMemo(() => {
    if (habits.length === 0) return null;
    return habits.reduce((prev, current) =>
      prev.currentStreak > current.currentStreak ? prev : current,
    );
  }, [habits]);

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
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
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[-10%] top-8 h-[600px] w-[600px] rounded-full bg-pink-600/5 blur-[120px]" />
        <div className="absolute right-[-8%] top-40 h-[600px] w-[600px] rounded-full bg-emerald-600/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex h-full">
        <motion.aside
          initial={false}
          animate={{
            width: isSidebarOpen ? 288 : 88,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 hidden h-screen shrink-0 overflow-hidden border-r border-white/10 bg-slate-900/40 p-6 backdrop-blur-3xl lg:flex lg:flex-col group"
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
                  <p className="text-lg font-semibold text-white tracking-tight truncate max-w-[140px]">
                    {user?.firstName || "ManologAI"}
                  </p>
                  <p className="text-sm text-slate-400">Intelligence engine</p>
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
                    ? "border-pink-500/30 bg-pink-500/10 text-white shadow-[0_0_20px_-10px_rgba(236,72,153,0.3)]"
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
              <Card className="mt-auto border-white/5 bg-white/5 backdrop-blur-xl shrink-0">
                <CardHeader className="p-4">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    Status
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-xs text-slate-300">
                      Analysis Engine Online
                    </p>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          )}
        </motion.aside>

        <main className="flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8">
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
                      <span className="text-xs text-slate-500">last 30d</span>
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
                  </CardHeader>
                  <CardContent className="h-[300px] w-full pr-6">
                    {moodData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={moodData}>
                          <defs>
                            <linearGradient
                              id="colorMood"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#ec4899"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#ec4899"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
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
                            ticks={[1, 2, 3, 4, 5]}
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            hide
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0f172a",
                              borderRadius: "12px",
                              border: "1px solid #ffffff10",
                              fontSize: "10px",
                            }}
                            itemStyle={{ color: "#f472b6" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#ec4899"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorMood)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono italic">
                        Log more emotions to see trends
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

              {/* Time Tracker Composition Chart */}
              <motion.div
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
