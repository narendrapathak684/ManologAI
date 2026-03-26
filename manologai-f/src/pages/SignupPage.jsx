import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    
    // TODO: Hook up with real backend API
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log("Signup data:", formData);
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 text-slate-100 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-3 text-center pb-6 border-b border-white/5">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 mb-2">
              <span className="font-bold text-2xl text-white">M</span>
            </div>
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">
              Create your account
            </CardTitle>
            <CardDescription className="text-slate-400">
              Start your journey to self-understanding
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="John Doe" 
                  required 
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-pink-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-black/20 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-pink-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-black/20 border-white/10 text-white focus-visible:ring-pink-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  required 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-black/20 border-white/10 text-white focus-visible:ring-pink-500"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-pink-600 hover:bg-pink-500 text-white h-11 shadow-[0_0_20px_-5px_rgba(236,72,153,0.5)] transition-all"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign Up"}
                {!loading && <Sparkles className="w-4 h-4 ml-2 opacity-70" />}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between">
              <span className="w-1/5 border-b border-white/10"></span>
              <span className="text-xs text-center text-slate-500 uppercase">or continue with</span>
              <span className="w-1/5 border-b border-white/10"></span>
            </div>

            <Button variant="outline" className="w-full mt-6 bg-white/5 border-white/10 hover:bg-white/10 text-slate-300">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              Google
            </Button>
          </CardContent>

          <CardFooter className="flex justify-center border-t border-white/5 pt-6 pb-6">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-pink-400 hover:text-pink-300 font-medium transition-colors">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
