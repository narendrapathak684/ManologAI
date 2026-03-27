import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:4545/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log in. Please try again.");
      }

      setUser(data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden p-6 text-slate-100">
      <div className="absolute top-1/2 left-1/2 h-[860px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-24 right-16 h-48 w-48 rounded-full bg-rose-500/10 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-16 left-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-3 border-b border-white/5 pb-6 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/20">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <CardTitle className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-2xl font-bold text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="text-slate-400">
              Log in to continue your journey of reflection and growth
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-center text-sm text-rose-400">
                  {error}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="border-white/10 bg-black/20 text-white placeholder:text-slate-600 focus-visible:ring-pink-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">
                    Password
                  </Label>
                  <span className="text-xs text-slate-500">Secure access</span>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="border-white/10 bg-black/20 text-white focus-visible:ring-pink-500"
                />
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-pink-500/15 p-2 text-pink-300">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Pick up where you left off
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Your diary, habits, mood check-ins, and life ratings stay
                      together in one calm workspace.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-pink-600 text-white shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)] transition-all hover:bg-pink-500"
              >
                {loading ? "Logging in..." : "Log In"}
                {!loading ? <ArrowRight className="ml-2 h-4 w-4 opacity-80" /> : null}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-white/5 pb-6 pt-6">
            <p className="text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-pink-400 transition-colors hover:text-pink-300"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
