import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenText,
  CalendarDays,
  ChartColumnBig,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  Circle,
  ChevronRight,
  Book,
  Lightbulb,
  Target,
  ShoppingCart,
  GraduationCap,
  ClipboardList,
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
  { label: "Track", icon: CheckCircle2, to: "/track" },
  { label: "Analytics", icon: ChartColumnBig, to: "/analytics" },
  { label: "Organise", icon: FolderKanban, to: "/organise", active: true },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 05:00 to 23:00

const PAD_ICONS = {
  goals: Target,
  books: Book,
  "to-learn": GraduationCap,
  "to-do": ClipboardList,
  "to-buy": ShoppingCart,
  ideas: Lightbulb,
  custom: FolderKanban
};

export default function OrganisePage() {
  const [activeTab, setActiveTab] = useState("timetable");
  const [timetable, setTimetable] = useState({});
  const [pads, setPads] = useState([]);
  const [selectedPad, setSelectedPad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newBlock, setNewBlock] = useState({ day: "monday", startTime: "09:00", endTime: "10:00", activity: "" });
  const [newItemTitle, setNewItemTitle] = useState("");
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
      const ttRes = await fetch("http://localhost:4545/timetable", { credentials: "include" });
      const ttJson = await ttRes.json();
      if (ttRes.ok) setTimetable(ttJson.schedule);

      const padsRes = await fetch("http://localhost:4545/pads", { credentials: "include" });
      const padsJson = await padsRes.json();
      if (padsRes.ok) setPads(padsJson.pads);

    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Failed to connect to the organisation hub.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4545/timetable/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newBlock)
      });
      if (res.ok) {
        setNewBlock({ day: "monday", startTime: "09:00", endTime: "10:00", activity: "" });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      const res = await fetch(`http://localhost:4545/timetable/blocks/${blockId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  // Pad Handlers
  const handleToggleItem = async (padId, itemId) => {
    try {
      const res = await fetch(`http://localhost:4545/pads/${padId}/items/${itemId}/toggle`, {
        method: "PATCH",
        credentials: "include"
      });
      if (res.ok) {
        setPads(pads.map(p => {
          if (p._id === padId) {
            return { ...p, items: p.items.map(i => i._id === itemId ? { ...i, done: !i.done } : i) };
          }
          return p;
        }));
      }
    } catch (err) { console.error(err); }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    try {
      const res = await fetch(`http://localhost:4545/pads/${selectedPad._id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: newItemTitle })
      });
      if (res.ok) {
        setNewItemTitle("");
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteItem = async (padId, itemId) => {
    try {
      const res = await fetch(`http://localhost:4545/pads/${padId}/items/${itemId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const getTimeRow = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return Math.max(1, (h - 5) * 2 + (m >= 30 ? 2 : 1));
  };

  const getDayBlocks = (day) => timetable[day] || [];

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-mono text-sm tracking-[0.3em] uppercase animate-pulse">
      Initialising Organisation Hub...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>

      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 288 : 88,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="hidden shrink-0 border-r border-white/10 bg-slate-900/40 p-6 backdrop-blur-3xl lg:flex lg:flex-col relative group z-10"
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
                 <p className="text-lg font-bold text-white tracking-tight truncate max-w-[140px]">
                   {user?.firstName || "ManologAI"}
                 </p>
                 <p className="text-xs text-slate-500 font-mono">Organise</p>
               </motion.div>
            </div>
          )}
          
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all ${isSidebarOpen ? "-mr-1" : ""}`}
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
                  ? "border-pink-500/30 bg-pink-500/10 text-white shadow-[0_0_20px_-10px_rgba(236,72,153,0.3)]"
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
      </motion.aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto relative z-10">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Structure your life.</h1>
            <p className="text-slate-400">Your weekly layout and structured notes in one unified hub.</p>
          </header>

          <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit mb-8">
            {["timetable", "pads"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-900/30" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "timetable" ? (
              <motion.div
                key="timetable"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Add Block Quick Entry */}
                <Card className="border-white/5 bg-white/[0.02] backdrop-blur-xl">
                  <form onSubmit={handleAddBlock} className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2 col-span-2">
                       <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">Activity Description</label>
                       <Input 
                        placeholder="Deep work, Gym, Study..." 
                        className="bg-black/20 border-white/10 text-white" 
                        value={newBlock.activity}
                        onChange={e => setNewBlock({...newBlock, activity: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">Day</label>
                       <select 
                        className="w-full h-10 bg-black/20 border-white/10 text-white rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                        value={newBlock.day}
                        onChange={e => setNewBlock({...newBlock, day: e.target.value})}
                       >
                         {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Start</label>
                        <Input 
                          type="time" 
                          className="bg-black/20 border-white/10 text-white p-1"
                          value={newBlock.startTime}
                          onChange={e => setNewBlock({...newBlock, startTime: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">End</label>
                        <Input 
                          type="time" 
                          className="bg-black/20 border-white/10 text-white p-1"
                          value={newBlock.endTime}
                          onChange={e => setNewBlock({...newBlock, endTime: e.target.value})}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white font-bold h-10">
                      <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                  </form>
                </Card>

                {/* Tabular Grid */}
                <div className="overflow-x-auto rounded-[32px] border border-white/10 bg-slate-900/40 backdrop-blur-3xl shadow-2xl pb-4">
                  <div className="min-w-[1000px] grid grid-cols-[80px_repeat(7,1fr)]">
                    {/* Header */}
                    <div className="h-14 border-b border-r border-white/10 flex items-center justify-center text-[10px] font-mono text-slate-500 uppercase">Time</div>
                    {DAYS.map(day => (
                      <div key={day} className="h-14 border-b border-white/10 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-slate-200 bg-white/5 border-r border-white/10">
                        {day}
                      </div>
                    ))}

                    {/* Time Slots + Data Grid */}
                    <div className="contents relative">
                      {/* Time Column */}
                      <div className="col-start-1 col-end-2">
                        {HOURS.map(hour => (
                          <div key={hour} className="h-12 border-b border-r border-white/10 flex items-center justify-center text-[10px] font-mono text-slate-600">
                            {hour.toString().padStart(2, '0')}:00
                          </div>
                        ))}
                      </div>

                      {/* Day Columns */}
                      {DAYS.map((day, dIdx) => (
                        <div key={day} className="col-start-[dIdx+2] col-end-[dIdx+3] relative h-full">
                           {/* Background Grid Lines */}
                           {HOURS.map(hour => (
                             <div key={hour} className="h-12 border-b border-r border-white/5 last-of-type:border-r-0" />
                           ))}

                           {/* Render blocks inside column */}
                           {getDayBlocks(day).map(block => {
                             const rowStart = getTimeRow(block.startTime);
                             const rowEnd = getTimeRow(block.endTime);
                             const durationCells = rowEnd - rowStart;
                             
                             return (
                               <motion.div
                                 key={block._id}
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="absolute left-1 right-1 rounded-xl p-2 z-10 group overflow-hidden border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md hover:bg-emerald-500/20 transition-all"
                                 style={{
                                   top: `${(rowStart - 1) * 24}px`, // 48px per hour, so 24px per half-hour
                                   height: `${durationCells * 24}px`
                                 }}
                               >
                                  <div className="flex flex-col h-full">
                                    <span className="text-[10px] font-bold text-emerald-400 mb-1 leading-tight">{block.activity}</span>
                                    <span className="text-[8px] font-mono text-emerald-600 uppercase">{block.startTime}–{block.endTime}</span>
                                    <button 
                                      onClick={() => handleDeleteBlock(block._id)}
                                      className="absolute right-1 top-1 p-1 bg-black/40 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                               </motion.div>
                             )
                           })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="pads"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8"
              >
                {/* Pads List */}
                <div className="space-y-4">
                  {pads.map(pad => {
                    const Icon = PAD_ICONS[pad.padType] || FolderKanban;
                    const isActive = selectedPad?._id === pad._id;
                    return (
                      <button
                        key={pad._id}
                        onClick={() => setSelectedPad(pad)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                          isActive 
                          ? "bg-pink-600/20 border-pink-500/50 text-white shadow-lg" 
                          : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isActive ? "bg-pink-500 text-white" : "bg-white/5 text-slate-500"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-sm">{pad.title}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? "rotate-90 text-pink-400" : "text-slate-700"}`} />
                      </button>
                    )
                  })}
                </div>

                {/* Pad Items View */}
                <div className="min-h-[600px]">
                  <AnimatePresence mode="wait">
                    {selectedPad ? (
                      <motion.div
                        key={selectedPad._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                               <CardTitle className="text-2xl text-white">{selectedPad.title}</CardTitle>
                               <CardDescription>{selectedPad.items.length} items logged</CardDescription>
                            </div>
                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
                               {(() => {
                                 const Icon = PAD_ICONS[selectedPad.padType] || FolderKanban;
                                 return <Icon className="w-5 h-5 text-pink-400" />
                               })()}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <form onSubmit={handleAddItem} className="flex gap-2">
                              <Input 
                                placeholder="Add a new entry..." 
                                className="bg-black/20 border-white/10 text-white h-12"
                                value={newItemTitle}
                                onChange={e => setNewItemTitle(e.target.value)}
                              />
                              <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white h-12 px-6">
                                <Plus className="w-5 h-5" />
                              </Button>
                            </form>

                            <div className="space-y-2">
                              {selectedPad.items.slice().reverse().map(item => (
                                <div key={item._id} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.03] group hover:bg-white/[0.06] transition-all">
                                  <button 
                                    onClick={() => handleToggleItem(selectedPad._id, item._id)}
                                    className={`shrink-0 transition-colors ${item.done ? "text-emerald-500" : "text-slate-600 hover:text-slate-400"}`}
                                  >
                                    {item.done ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                  </button>
                                  <span className={`flex-1 text-sm ${item.done ? "text-slate-500 line-through decoration-emerald-500/30" : "text-slate-200"}`}>
                                    {item.title}
                                  </span>
                                  <button 
                                    onClick={() => handleDeleteItem(selectedPad._id, item._id)}
                                    className="p-2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-[40px]">
                        <div className="text-center space-y-2">
                          <FolderKanban className="w-12 h-12 text-slate-800 mx-auto" />
                          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">Select a pad from the left</p>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
