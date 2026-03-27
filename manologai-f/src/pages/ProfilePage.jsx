import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  User,
  Key,
  LogOut,
  ChevronLeft,
  LayoutDashboard,
  BookOpenText,
  CheckCircle2,
  ChartColumnBig,
  FolderKanban,
  AlertCircle,
  CheckCircle,
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
  { label: "Organise", icon: FolderKanban, to: "/organise" },
];

export default function ProfilePage() {
  const { user, setUser, loading: authLoading, logout } = useAuth();
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "" });
  const [status, setStatus] = useState({ type: null, message: "" });
  const [isResetting, setIsResetting] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    setStatus({ type: null, message: "" });
    try {
      const res = await fetch("http://localhost:4545/profile/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passForm),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: "success", message: "Password reset successfully" });
        setPassForm({ currentPassword: "", newPassword: "" });
      } else {
        setStatus({ type: "error", message: data.error || "Failed to reset password" });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Failed to connect to server" });
    } finally {
      setIsResetting(false);
    }
  };


  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-mono text-sm tracking-[0.3em] uppercase animate-pulse">
        Initialising Profile Hub...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[-10%] top-8 h-[600px] w-[600px] rounded-full bg-pink-600/5 blur-[120px]" />
        <div className="absolute right-[-8%] top-40 h-[600px] w-[600px] rounded-full bg-emerald-600/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
             <Link to="/profile" className="flex h-11 w-11 items-center justify-center rounded-xl border border-pink-500/30 bg-pink-500/10 text-white shadow-[0_0_20px_-10px_rgba(236,72,153,0.3)] hover:scale-105 transition-all">
                <User className="h-5 w-5 text-pink-300" />
             </Link>
            <div>
              <p className="text-lg font-bold text-white tracking-tight">ManologAI</p>
              <p className="text-xs text-slate-500 font-mono">Settings Hub</p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map(({ label, icon: Icon, to }) => (
              <Button
                key={label}
                asChild
                variant="ghost"
                className="h-auto w-full justify-start rounded-xl border border-transparent bg-white/0 px-4 py-3 text-left text-sm font-medium text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-slate-200 transition-all"
              >
                <Link to={to}>
                  <Icon className="mr-3 h-4 w-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto">
          <div className="mx-auto max-w-3xl">
            <header className="mb-12">
               <Link to="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-pink-400 transition-colors mb-6 group">
                  <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
               </Link>
               <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Account Settings.</h1>
               <p className="text-slate-400 text-lg">Manage your identity and security keys.</p>
            </header>

            <div className="space-y-8">
              {/* Profile Overview */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-white/10 bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <User className="w-32 h-32" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                       <User className="h-5 w-5 text-pink-400" /> Identity
                    </CardTitle>
                    <CardDescription>Your essential account details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                           <p className="text-xs font-mono uppercase tracking-widest text-slate-500">First Name</p>
                           <p className="text-lg font-medium text-white">{user?.firstName || "—"}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Last Name</p>
                           <p className="text-lg font-medium text-white">{user?.lastName || "—"}</p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                           <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Email Address</p>
                           <p className="text-lg font-medium text-white">{user?.email || "—"}</p>
                        </div>
                     </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Password Reset */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-white/10 bg-slate-900/40 backdrop-blur-3xl">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                       <Key className="h-5 w-5 text-emerald-400" /> Security
                    </CardTitle>
                    <CardDescription>Update your access credentials.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">Current Password</label>
                        <Input
                          type="password"
                          className="bg-black/20 border-white/10 text-white h-12 focus:border-pink-500/50"
                          value={passForm.currentPassword}
                          onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-slate-500">New Password</label>
                        <Input
                          type="password"
                          className="bg-black/20 border-white/10 text-white h-12 focus:border-emerald-500/50"
                          value={passForm.newPassword}
                          onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                          required
                        />
                      </div>
                      
                      <AnimatePresence>
                        {status.message && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`flex items-center gap-2 p-4 rounded-xl text-sm ${
                              status.type === "success" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {status.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {status.message}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-50"
                        disabled={isResetting}
                      >
                        {isResetting ? "Synchronising..." : "Reset Security Keys"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Session Termination */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="w-full h-14 border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-2xl transition-all"
                >
                  <LogOut className="mr-2 h-5 w-5" /> Terminate Current Session
                </Button>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
