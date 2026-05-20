import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  PieChart,
  BrainCircuit,
  ListTodo,
  Clock,
  Star,
  Smile,
  CalendarDays,
  LayoutDashboard } from
"lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent } from
"@/components/ui/card";
import AnalyticsPreview from "@/components/AnalyticsPreview";

const features = [
{
  title: "Daily Diary",
  description:
  "A private reflection space for thoughts, experiences, and learning with a built-in streak system.",
  icon: BookOpen,
  color: "text-blue-400",
  bg: "bg-blue-400/10",
  cardBg: "bg-blue-500/[0.03]",
  border: "border-blue-500/10"
},
{
  title: "Habit Tracker",
  description:
  "Build and maintain behavioral consistency with daily or custom-day tracking and calendar heatmaps.",
  icon: PieChart,
  color: "text-emerald-400",
  bg: "bg-emerald-400/10",
  cardBg: "bg-emerald-500/[0.03]",
  border: "border-emerald-500/10"
},
{
  title: "Insight Engine",
  description:
  "Your personal data scientist. Discover hidden correlations between your habits, sleep, and mood.",
  icon: BrainCircuit,
  color: "text-violet-400",
  bg: "bg-violet-400/10",
  cardBg: "bg-violet-500/[0.03]",
  border: "border-violet-500/10"
},
{
  title: "Structured Pads",
  description:
  "Keep organized spaces for Goals, Books, To-Do lists, and wild Ideas separate from your journal.",
  icon: ListTodo,
  color: "text-amber-400",
  bg: "bg-amber-400/10",
  cardBg: "bg-amber-500/[0.03]",
  border: "border-amber-500/10"
},
{
  title: "Time Tracker",
  description:
  "Log objective metrics like sleep, screen time, and deep work in under 10 seconds a day.",
  icon: Clock,
  color: "text-rose-400",
  bg: "bg-rose-400/10",
  cardBg: "bg-rose-500/[0.03]",
  border: "border-rose-500/10"
},
{
  title: "Life Rating",
  description:
  "Measure subjective satisfaction across 8 key life areas like Health, Finances, and Relationships.",
  icon: Star,
  color: "text-yellow-400",
  bg: "bg-yellow-400/10",
  cardBg: "bg-yellow-500/[0.03]",
  border: "border-yellow-500/10"
},
{
  title: "Emotion Tracker",
  description:
  "A lightning-fast daily mood check-in to identify what triggers your best and worst days.",
  icon: Smile,
  color: "text-pink-400",
  bg: "bg-pink-400/10",
  cardBg: "bg-pink-500/[0.03]",
  border: "border-pink-500/10"
},
{
  title: "Timetable Creator",
  description:
  "Plan your ideal week using conflict-free time blocks to structure your days perfectly.",
  icon: CalendarDays,
  color: "text-cyan-400",
  bg: "bg-cyan-400/10",
  cardBg: "bg-cyan-500/[0.03]",
  border: "border-cyan-500/10"
},
{
  title: "Daily Dashboard",
  description:
  "The ultimate command center. All your daily inputs, tasks, and reflections bundled in one view.",
  icon: LayoutDashboard,
  color: "text-indigo-400",
  bg: "bg-indigo-400/10",
  cardBg: "bg-indigo-500/[0.03]",
  border: "border-indigo-500/10"
}];



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

export default function WelcomePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen relative overflow-hidden text-slate-100 flex flex-col">
      {}
      <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none">
        <div className="absolute left-[-10%] top-8 h-80 w-80 rounded-full bg-pink-600/10 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/20 blur-[120px] rounded-full" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 blur-[100px] rounded-full" />
      </div>

      {}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-row items-center justify-between gap-3 flex-nowrap relative z-10">
        
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/logo.png"
            alt="ManologAI Logo"
            className="w-8 h-8 object-contain" />
          
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white whitespace-nowrap">
            Manolog
          </span>
        </div>
        <div className="flex flex-row items-center gap-2 sm:gap-3 shrink-0">
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-full border border-white/15 bg-white/5 px-4 text-xs sm:text-sm font-semibold text-white/90 hover:bg-white/10 hover:text-white whitespace-nowrap">
            
            <Link to="/login">Log in</Link>
          </Button>
          <Button
            asChild
            className="h-9 rounded-full bg-white text-slate-900 hover:bg-slate-200 shadow-sm px-4 text-xs sm:text-sm whitespace-nowrap">
            
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </motion.nav>

      <main className="flex-1 flex flex-col pt-12 pb-32 relative z-10">
        {}
        <section className="w-full max-w-5xl mx-auto px-6 text-center space-y-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-medium uppercase tracking-wider mb-6">
            
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>The Personal Life Analytics Platform</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            
            Understand yourself <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400">
              through data & reflection
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            
            Manolog combines journaling, habit tracking, time logging, and
            AI-powered insights into one beautifully unified daily ritual.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-base w-full sm:w-auto rounded-full bg-pink-600 hover:bg-pink-500 text-white font-semibold transition-all shadow-[0_0_40px_-10px_rgba(236,72,153,0.5)] hover:shadow-[0_0_60px_-10px_rgba(236,72,153,0.7)] hover:-translate-y-1">
              
              <Link to="/signup">Start Your Journey</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base w-full sm:w-auto rounded-full bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors"
              onClick={() =>
              document.
              getElementById("features")?.
              scrollIntoView({ behavior: "smooth" })
              }>
              
              Explore Features
            </Button>
          </motion.div>
        </section>

        {}
        <section id="features" className="w-full max-w-7xl mx-auto px-6 mt-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4">
            
            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
              Everything you need to know yourself
            </h2>
            <p className="text-slate-400 text-lg">
              9 integrated features — all in one place.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}>
                  
                  <Card
                    className={`h-full rounded-2xl ${feature.cardBg} border ${feature.border} hover:bg-white/[0.05] transition-colors relative overflow-hidden group shadow-lg`}>
                    
                    {}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <CardHeader className="pb-2">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.bg} ${feature.color}`}>
                        
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-slate-200">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <CardDescription className="text-slate-400 leading-relaxed text-sm">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>);

            })}
          </motion.div>
        </section>

        {}
        <AnalyticsPreview />
      </main>

      {}
      <footer className="w-full border-t border-white/10 py-8 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Manolog. All rights reserved.</p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="hover:text-slate-300 transition-colors">
              
              Privacy
            </Link>
            <Link
              to="/terms"
              className="hover:text-slate-300 transition-colors">
              
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>);

}

function SparklesIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>);

}