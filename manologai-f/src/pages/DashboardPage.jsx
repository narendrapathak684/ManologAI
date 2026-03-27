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
} from "lucide-react";

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
  { label: "Track", icon: CheckCircle2, to: "/dashboard" },
  { label: "Analytics", icon: ChartColumnBig, to: "/dashboard" },
  { label: "Organise", icon: FolderKanban, to: "/dashboard" },
];

const todayCards = [
  {
    title: "Morning focus",
    value: "2h 20m",
    note: "Deep work logged before noon",
    accent: "from-pink-500/25 to-rose-500/5",
  },
  {
    title: "Mood pulse",
    value: "Calm + Sharp",
    note: "Better than your 7-day average",
    accent: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    title: "Habit score",
    value: "6 / 8",
    note: "Two quick wins still pending",
    accent: "from-indigo-500/20 to-indigo-500/5",
  },
];

const journalEntries = [
  "Write a short evening reflection about what made today easier.",
  "Capture one uncomfortable thought before it becomes mental noise.",
  "Note the moment you felt most energised and why.",
];

const trackingItems = [
  { label: "Sleep", value: "7.4 hrs" },
  { label: "Screen time", value: "3.1 hrs" },
  { label: "Workout", value: "Completed" },
  { label: "Reading", value: "24 mins" },
];

const organiseItems = [
  "Review weekly timetable blocks",
  "Sort idea pad into goals and experiments",
  "Plan tomorrow's top 3 priorities",
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute left-[-10%] top-8 h-80 w-80 rounded-full bg-pink-600/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-8%] top-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-[150px]" />

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/20">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Manolog</p>
              <p className="text-sm text-slate-400">Your daily command center</p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
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
                <Link to={to}>
                  <Icon className={`mr-3 h-4 w-4 ${active ? "text-pink-300" : ""}`} />
                  {label}
                </Link>
              </Button>
            ))}
          </nav>

          <Card className="mt-auto border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Sparkles className="h-4 w-4 text-pink-400" />
                Daily intention
              </CardTitle>
              <CardDescription>
                Keep the dashboard focused on what actually matters today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-300">
                Protect your attention, finish one meaningful thing, and leave a
                clean note for tomorrow.
              </p>
            </CardContent>
          </Card>
        </aside>

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
                  <Button asChild className="bg-pink-600 text-white hover:bg-pink-500">
                    <Link to="/journal">
                    New journal entry
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  >
                    Review analytics
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
                      <Card className="overflow-hidden border-white/10 bg-slate-900/50 backdrop-blur-xl">
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
                  <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <BookOpenText className="h-5 w-5 text-pink-400" />
                        Journal
                      </CardTitle>
                      <CardDescription>
                        Prompts to help you turn thoughts into useful reflection.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {journalEntries.map((entry) => (
                        <div
                          key={entry}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300"
                        >
                          {entry}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
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
                      {trackingItems.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <span className="text-sm text-slate-400">{item.label}</span>
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
                <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
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
                    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">
                        Weekly trend
                      </p>
                      <p className="mt-3 text-3xl font-black text-white">+18%</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Your consistency is up compared with last week, mostly
                        driven by lower screen time and stronger morning focus.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-white/5 p-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          Mood
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">8.4</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          Sleep
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">7.2h</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          Focus
                        </p>
                        <p className="mt-2 text-lg font-bold text-white">81%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
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
                    {organiseItems.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300"
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
    </div>
  );
}
