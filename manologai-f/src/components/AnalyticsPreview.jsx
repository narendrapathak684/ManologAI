import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  Cell } from
"recharts";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BrainCircuit, TrendingUp, Zap, Calendar, Activity, ArrowUpRight, BarChart3, Target } from "lucide-react";

const multiData = [
{ day: "Mon", screen: 4.2, sleep: 7.0, work: 8.5, completion: 85 },
{ day: "Tue", screen: 3.8, sleep: 7.5, work: 8.0, completion: 92 },
{ day: "Wed", screen: 5.5, sleep: 6.2, work: 9.0, completion: 78 },
{ day: "Thu", screen: 4.0, sleep: 7.8, work: 7.5, completion: 95 },
{ day: "Fri", screen: 6.2, sleep: 6.5, work: 6.0, completion: 60 },
{ day: "Sat", screen: 7.5, sleep: 8.5, work: 2.0, completion: 45 },
{ day: "Sun", screen: 6.8, sleep: 8.0, work: 1.5, completion: 55 }];


const radarData = [
{ subject: 'Health', A: 120, fullMark: 150 },
{ subject: 'Wealth', A: 98, fullMark: 150 },
{ subject: 'Social', A: 86, fullMark: 150 },
{ subject: 'Spirit', A: 99, fullMark: 150 },
{ subject: 'Career', A: 85, fullMark: 150 },
{ subject: 'Growth', A: 65, fullMark: 150 }];


const overallCompletion = [
{ name: 'Completed', value: 72 },
{ name: 'Remaining', value: 28 }];


const COLORS = ['#ec4899', '#ffffff10'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-slate-300 font-bold mb-1">{label}</p>
        {payload.map((pld, index) =>
        <p key={index} className="text-xs" style={{ color: pld.stroke || pld.fill }}>
            {pld.name}: {pld.value}{pld.unit || (pld.name === 'completion' ? '%' : 'h')}
          </p>
        )}
      </div>);

  }
  return null;
};

export default function AnalyticsPreview() {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 mt-32 relative">
      {}
      <div className="absolute -top-40 -left-64 w-[500px] h-[500px] bg-pink-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 -right-64 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16 space-y-4">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-widest">
          <Activity className="w-4 h-4" />
          Analytics Deep Dive
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white">Visual Intelligence</h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Manolog decodes the silent correlations in your daily inputs with stunning interactive visualizations.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 mb-12">
        
        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-4">
          
          <Card className="bg-white/[0.03] border-white/[0.05] h-full p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <BarChart3 className="w-40 h-40 text-pink-400" />
            </div>
            <CardHeader className="p-0 mb-8">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Screen vs Sleep vs Work
              </CardTitle>
              <CardDescription className="text-sm">7-day life balance distribution</CardDescription>
            </CardHeader>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={multiData}>
                  <defs>
                    <linearGradient id="colorScreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area name="Screen" type="monotone" dataKey="screen" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorScreen)" stackId="1" />
                  <Area name="Sleep" type="monotone" dataKey="sleep" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSleep)" stackId="1" />
                  <Area name="Work" type="monotone" dataKey="work" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWork)" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2">
          
          <Card className="bg-white/[0.03] border-white/[0.05] h-full p-6 flex flex-col justify-center text-center">
            <CardHeader className="p-0 mb-4 px-2">
              <CardTitle className="text-lg font-bold text-white flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-pink-400" />
                Target Reached
              </CardTitle>
            </CardHeader>
            <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={overallCompletion}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={180}
                    endAngle={-180}>
                    
                    {overallCompletion.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">72%</span>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Overall completion</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-3">
          
          <Card className="bg-white/[0.03] border-white/[0.05] p-6 h-full">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-bold text-white uppercase tracking-tight">Life Balance Radar</CardTitle>
              <CardDescription className="text-sm">Satisfaction across core pillars</CardDescription>
            </CardHeader>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#10b981', fontSize: 12 }} />
                  <Radar name="Balance" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} activeDot={{ r: 8 }} isAnimationActive={true} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3">
          
          <Card className="bg-white/[0.03] border-white/[0.05] p-6 h-full relative overflow-hidden">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-bold text-white uppercase tracking-tight">Weekly Completion %</CardTitle>
              <CardDescription className="text-sm">Daily habit consistency trends</CardDescription>
            </CardHeader>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={multiData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="completion" radius={[10, 10, 0, 0]}>
                    {multiData.map((entry, index) =>
                    <Cell key={`cell-${index}`} fill={entry.completion > 80 ? '#ec4899' : '#6366f1'} />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

      </div>

      {}
      <div className="mt-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-4 mb-10">
          
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
             <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">Insight Engine</h3>
            <p className="text-slate-500 text-sm">Automatically discovering patterns in your life.</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-pink-500/5 border border-pink-500/10 backdrop-blur-md space-y-4 group transition-colors hover:bg-pink-500/10">
            
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">Habit Impact</p>
              <p className="text-white text-sm leading-relaxed">
                On days you complete your <span className="text-pink-400 font-bold underline decoration-pink-500/50 underline-offset-4">morning run</span>, you feel Happy or Calm <span className="font-black">78%</span> of the time.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-md space-y-4 group transition-colors hover:bg-emerald-500/10">
            
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Pattern Discovery</p>
              <p className="text-white text-sm leading-relaxed">
                Habit completion drops on <span className="font-bold underline decoration-emerald-500/50 underline-offset-4 tracking-tight">Fridays and weekends</span> — <span className="font-black text-rose-500">40% below</span> weekday average.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-md space-y-4 group transition-colors hover:bg-indigo-500/10">
            
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Trend Warning</p>
              <p className="text-white text-sm leading-relaxed">
                Screen time has increased <span className="font-black text-indigo-400">1.4 hrs/day</span> over the past 3 weeks. Recommendation: Set app limits.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>);

}