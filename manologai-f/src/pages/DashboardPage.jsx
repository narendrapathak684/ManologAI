import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpenText,
  CalendarDays,
  ChartColumnBig,
  CheckCircle2,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  Sparkles,
  Target,
  User,
  X,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MobileTabBar from "../components/MobileTabBar";
import { api, getApiErrorMessage } from "../lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const welcomeMessage = welcomeMessages[dayOfYear % welcomeMessages.length];

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

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

  const habitScoreValue =
    habitScore && habitScore.total > 0
      ? `${habitScore.completed} / ${habitScore.total}`
      : "—";
  const habitScoreNote = habitScoreError
    ? habitScoreError
    : habitScore && habitScore.total > 0
      ? `${habitScore.percent}% completion (last ${habitScore.days} days)`
      : "No habits tracked yet";

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
                  <p className="text-sm text-slate-400">Command Center</p>
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

          <nav className="space-y-1 overflow-hidden">
            {navItems.map(({ label, icon: Icon, active, to }) => (
              <Button
                key={label}
                asChild
                variant="ghost"
                className={`h-auto w-full justify-start rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                  active
                    ? "border-pink-500/30 bg-pink-500/10 text-white shadow-[0_0_30px_-18px_rgba(236,72,153,0.9)]"
                    : "border-transparent bg-white/0 text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200"
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
              <Card className="border-white/10 bg-white/5 overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-white">
                    <Sparkles className="h-4 w-4 text-pink-400" />
                    Daily intention
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs leading-5 text-slate-400">
                    Protect your attention, finish one meaningful thing, and
                    leave a clean note for tomorrow.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!isSidebarOpen && (
            <div className="mt-auto flex justify-center">
              <Sparkles className="h-5 w-5 text-pink-500/40" />
            </div>
          )}
        </motion.aside>

        <main className="flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8">
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

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                  <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
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
                  </Card>

                  <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
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
                  </Card>
                </div>
              </div>

              <div className="grid gap-6">
                <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
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
                        Your consistency is up compared with last week, mostly
                        driven by lower screen time and stronger morning focus.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div
                        className={`rounded-xl border p-4 text-center ${analyticsStatThemes[0]}`}
                      >
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          Mood
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">8.4</p>
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
                        <p className="mt-2 text-lg font-bold text-white">81%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900/70 to-slate-950/95 backdrop-blur-xl">
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
                          organiseItemThemes[index % organiseItemThemes.length]
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </main>
      </div>

      <MobileTabBar items={navItems} />
    </div>
  );
}
