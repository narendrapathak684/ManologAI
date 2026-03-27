import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const navItems = [
  { label: "Today", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Journal", icon: BookOpenText, to: "/journal" },
  { label: "Track", icon: CheckCircle2, to: "/track", active: true },
  { label: "Analytics", icon: ChartColumnBig, to: "/analytics" },
  { label: "Organise", icon: FolderKanban, to: "/organise" },
];

export default function TrackPage() {
  const [habits, setHabits] = useState([]);
  const [metrics, setMetrics] = useState({
    sleep: "",
    screen: "",
    workStudy: "",
    expense: ""
  });
  const [lifeRatings, setLifeRatings] = useState({
    partner: 5,
    familyFriends: 5,
    health: 5,
    finances: 5,
    career: 5,
    physicalEnvironment: 5,
    funRecreation: 5,
    personalGrowth: 5,
  });
  const [newHabitName, setNewHabitName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [savingLifeRatings, setSavingLifeRatings] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch habits
      const habitsRes = await fetch("http://localhost:4545/habits", {
        credentials: "include"
      });
      const habitsData = await habitsRes.json();
      if (habitsRes.ok) {
        setHabits(habitsData.habits);
      }

      // Fetch today's metrics
      const metricsRes = await fetch("http://localhost:4545/time-tracker/today", {
        credentials: "include"
      });
      const metricsData = await metricsRes.json();
      if (metricsRes.ok) {
        setMetrics({
          sleep: metricsData.entry.sleep || "",
          screen: metricsData.entry.screen || "",
          workStudy: metricsData.entry.workStudy || "",
          expense: metricsData.entry.expense || ""
        });
      }

      // Fetch today's life ratings
      const lifeRatingsRes = await fetch("http://localhost:4545/life-ratings/day", {
        credentials: "include"
      });
      const lifeRatingsData = await lifeRatingsRes.json();
      if (lifeRatingsRes.ok && lifeRatingsData.entry && lifeRatingsData.entry.ratings) {
        setLifeRatings({
          partner: lifeRatingsData.entry.ratings.partner ?? 5,
          familyFriends: lifeRatingsData.entry.ratings.familyFriends ?? 5,
          health: lifeRatingsData.entry.ratings.health ?? 5,
          finances: lifeRatingsData.entry.ratings.finances ?? 5,
          career: lifeRatingsData.entry.ratings.career ?? 5,
          physicalEnvironment: lifeRatingsData.entry.ratings.physicalEnvironment ?? 5,
          funRecreation: lifeRatingsData.entry.ratings.funRecreation ?? 5,
          personalGrowth: lifeRatingsData.entry.ratings.personalGrowth ?? 5,
        });
      }
    } catch (err) {
      console.error("Failed to fetch tracking data:", err);
      setError("Failed to load tracking data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabit = async (habitId, isCompleted) => {
    try {
      const url = isCompleted 
        ? `http://localhost:4545/habits/${habitId}/check/${today}`
        : `http://localhost:4545/habits/${habitId}/check`;
      
      const method = isCompleted ? "DELETE" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include"
      });

      if (res.ok) {
        // Refresh habits to update streaks and completion status
        const habitsRes = await fetch("http://localhost:4545/habits", {
          credentials: "include"
        });
        const habitsData = await habitsRes.json();
        setHabits(habitsData.habits);
      }
    } catch (err) {
      console.error("Failed to toggle habit:", err);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    try {
      const res = await fetch("http://localhost:4545/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newHabitName, frequency: "daily" })
      });

      if (res.ok) {
        setNewHabitName("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to add habit:", err);
    }
  };

  const handleSaveMetrics = async () => {
    setSavingMetrics(true);
    try {
      const res = await fetch("http://localhost:4545/time-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(metrics)
      });

      if (res.ok) {
        // Show success state briefly if needed
      }
    } catch (err) {
      console.error("Failed to save metrics:", err);
    } finally {
      setSavingMetrics(false);
    }
  };

  const handleSaveLifeRatings = async () => {
    setSavingLifeRatings(true);
    try {
      const res = await fetch("http://localhost:4545/life-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(lifeRatings)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save life ratings");
      }
    } catch (err) {
      console.error("Failed to save life ratings:", err);
      setError(err.message);
    } finally {
      setSavingLifeRatings(false);
    }
  };

  const isHabitDoneToday = (habit) => {
    if (!habit || !habit.history || !Array.isArray(habit.history)) return false;
    return habit.history.some(h => {
      const hDate = typeof h.date === 'string' ? h.date : String(h.date || '');
      return hDate && hDate.startsWith(today) && h.completed;
    });
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
                   <p className="text-sm text-slate-400">Tracking engine</p>
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
                    ? "border-pink-500/30 bg-pink-500/10 text-white shadow-[0_0_30px_-18px_rgba(236,72,153,0.9)]"
                    : "border-transparent bg-white/0 text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200"
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
                  <CardTitle className="text-sm text-white">Habit Streak</CardTitle>
                  <CardDescription className="text-xs">
                    Consistency is the key to building lasting change.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          )}
        </motion.aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
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
                      Log your habits and daily metrics to see your progress 
                      and identify patterns in your behavior over time.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              {/* Habits Section */}
              <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl h-fit">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-pink-400" />
                    Daily Habits
                  </CardTitle>
                  <CardDescription>
                    Small wins every day lead to big results.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddHabit} className="flex gap-2 mb-6">
                    <Input 
                      placeholder="New habit name..." 
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-pink-500"
                    />
                    <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white shrink-0">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </form>

                  {loading ? (
                    <p className="text-slate-500 text-sm italic">Loading habits...</p>
                  ) : habits.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">No habits added yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {habits.map((habit) => {
                        const done = isHabitDoneToday(habit);
                        return (
                          <div 
                            key={habit._id} 
                            className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5"
                          >
                            <div>
                              <p className="font-medium text-slate-200">{habit.name}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                Streak: <span className="text-pink-400">{habit.currentStreak} days</span> (Best: {habit.longestStreak})
                              </p>
                            </div>
                            <Button
                              onClick={() => handleToggleHabit(habit._id, done)}
                              variant={done ? "default" : "outline"}
                              className={done 
                                ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/30" 
                                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}
                            >
                              {done ? "Completed" : "Mark Done"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metrics Section */}
              <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl h-fit">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-emerald-400" />
                    Daily Metrics
                  </CardTitle>
                  <CardDescription>
                    Quantify your day to understand your baseline.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Moon className="h-3 w-3" /> Sleep (Hours)
                      </label>
                      <Input 
                        type="number"
                        placeholder="0.0"
                        value={metrics.sleep}
                        onChange={(e) => setMetrics({...metrics, sleep: e.target.value})}
                        className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Monitor className="h-3 w-3" /> Screen Time (Hrs)
                      </label>
                      <Input 
                        type="number"
                        placeholder="0.0"
                        value={metrics.screen}
                        onChange={(e) => setMetrics({...metrics, screen: e.target.value})}
                        className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Briefcase className="h-3 w-3" /> Work/Study (Hrs)
                      </label>
                      <Input 
                        type="number"
                        placeholder="0.0"
                        value={metrics.workStudy}
                        onChange={(e) => setMetrics({...metrics, workStudy: e.target.value})}
                        className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <DollarSign className="h-3 w-3" /> Expenses ($)
                      </label>
                      <Input 
                        type="number"
                        placeholder="0.0"
                        value={metrics.expense}
                        onChange={(e) => setMetrics({...metrics, expense: e.target.value})}
                        className="bg-black/20 border-white/10 text-white focus-visible:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveMetrics} 
                    disabled={savingMetrics}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white mt-4"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingMetrics ? "Saving..." : "Save Today's Metrics"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Life Ratings Section */}
            <Card className="mt-6 border-white/10 bg-slate-900/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-400" />
                      Life Balance
                    </CardTitle>
                    <CardDescription>
                      Rate your satisfaction across 8 key areas of your life (0-10).
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={handleSaveLifeRatings} 
                    disabled={savingLifeRatings}
                    className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {savingLifeRatings ? "Saving..." : "Save Life Ratings"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-4">
                  {[
                    { key: "health", label: "Health", icon: Activity, color: "text-emerald-400" },
                    { key: "career", label: "Career", icon: Briefcase, color: "text-blue-400" },
                    { key: "finances", label: "Finances", icon: Wallet, color: "text-amber-400" },
                    { key: "partner", label: "Partner", icon: Heart, color: "text-rose-400" },
                    { key: "familyFriends", label: "Family & Friends", icon: Users, color: "text-indigo-400" },
                    { key: "physicalEnvironment", label: "Environment", icon: Home, color: "text-orange-400" },
                    { key: "funRecreation", label: "Fun", icon: Palmtree, color: "text-cyan-400" },
                    { key: "personalGrowth", label: "Growth", icon: TrendingUp, color: "text-pink-400" },
                  ].map((cat) => (
                    <div key={cat.key} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <cat.icon className={`h-3.5 w-3.5 ${cat.color}`} /> {cat.label}
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
                          onChange={(e) => setLifeRatings({ ...lifeRatings, [cat.key]: parseInt(e.target.value) })}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500 group-hover:bg-white/20 transition-all"
                        />
                        <div className="flex justify-between mt-2 px-0.5">
                          {[0, 2, 4, 6, 8, 10].map((tick) => (
                            <span key={tick} className="text-[10px] text-slate-600 font-medium">
                              {tick}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
