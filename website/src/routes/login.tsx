import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Noospace" },
      { name: "description", content: "Log in or create your Noospace account to manage projects and schedules." },
      { property: "og:title", content: "Sign in — Noospace" },
      { property: "og:description", content: "Log in or create your Noospace account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  // We use one state to drive both mobile and desktop. 
  // Mobile has 3 screens: splash, login, signup
  const [mode, setMode] = useState<"splash" | "login" | "signup">("splash");
  const [showPassword, setShowPassword] = useState(false);

  // Desktop only has 2 modes, so splash defaults to login
  const desktopMode = mode === "splash" ? "login" : mode;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Logged in");
    navigate({ to: "/" });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Account created");
    navigate({ to: "/" });
  };

  const LogoIcon = () => (
    <div className="flex items-center justify-center">
      <div className="grid size-14 place-items-center rounded-full bg-white text-3xl font-black text-[#1D4ED8] shadow-sm">
        N
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE FLOW */}
      <div className="md:hidden flex min-h-screen flex-col bg-white font-sans text-slate-900">
        {mode === "splash" && (
          <div className="flex flex-1 flex-col justify-between bg-gradient-to-b from-[#1D4ED8] via-[#3B82F6]/90 to-white px-6 pb-12 pt-32 text-center">
            <div className="flex flex-col items-center gap-4 mt-8">
              <LogoIcon />
              <h1 className="text-4xl font-bold text-white tracking-tight">Noospace</h1>
            </div>
            
            <div className="flex flex-col gap-4 mt-auto">
              <p className="text-xs font-medium text-slate-600 mb-2 px-4">
                Your AI Assistant for Case Law and Legal Insight.
              </p>
              <Button onClick={() => setMode("login")} className="h-12 w-full rounded-full bg-[#1D4ED8] text-base font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/30">
                Sign In
              </Button>
              <Button onClick={() => setMode("signup")} variant="outline" className="h-12 w-full rounded-full border border-slate-300 text-[#1D4ED8] bg-transparent hover:bg-blue-50 text-base font-semibold">
                Create Account
              </Button>
            </div>
          </div>
        )}

        {mode === "login" && (
          <div className="flex flex-1 flex-col px-6 py-8">
            <div className="flex items-center justify-between mb-12 mt-4">
              <div className="grid size-10 place-items-center rounded-full bg-[#1D4ED8] text-white font-bold shadow-sm text-lg">
                N
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Noospace</span>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 ml-1">Email / Username</Label>
                <Input required type="email" placeholder="nathan.roberts@example.com" className="h-12 rounded-full bg-slate-100 border-transparent px-5 text-sm placeholder:text-slate-400" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-700 ml-1">Password</Label>
                <div className="relative">
                  <Input required type={showPassword ? "text" : "password"} placeholder="axkLC8wyqA4M" className="h-12 rounded-full bg-slate-100 border-transparent px-5 pr-12 text-sm placeholder:text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="h-12 w-full rounded-full bg-[#1D4ED8] text-base font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20">
                Sign In
              </Button>

              <div className="text-center">
                <button type="button" className="text-sm font-semibold text-[#1D4ED8]">Forgot Password?</button>
              </div>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="bg-white px-4 text-slate-400 font-semibold uppercase tracking-wider">Or</span>
                </div>
              </div>

              <div>
                <Button type="button" variant="outline" className="h-12 w-full rounded-full border-transparent bg-slate-50 hover:bg-slate-100 justify-center gap-3">
                  <span className="font-bold text-red-500">G</span>
                  <span className="text-[13px] font-medium text-slate-700">Continue with Google</span>
                </Button>
              </div>

              <div className="mt-5 text-center">
                <p className="text-[13px] font-medium text-slate-600">
                  Don't have an account?{" "}
                  <button type="button" className="text-[#1D4ED8] font-semibold" onClick={() => setMode("signup")}>Sign up</button>
                </p>
              </div>
            </form>

            <div className="mt-8 text-center pb-2">
              <span className="text-[10px] text-slate-400 font-medium">© 2026 Noospace</span>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div className="flex flex-1 flex-col px-6 py-8">
            <div className="flex items-center gap-3 mb-8 mt-2">
              <button onClick={() => setMode("login")} className="p-2 -ml-2 text-slate-700">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-[19px] font-medium tracking-tight">Create Account</h1>
            </div>

            <form className="flex-1 space-y-4" onSubmit={handleSignup}>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 ml-1">Full Name</Label>
                <Input required placeholder="Vincze Nikolett" className="h-11 rounded-full bg-slate-50 border-transparent px-5 text-sm placeholder:text-slate-300" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 ml-1">Work Email</Label>
                <Input required type="email" placeholder="nathan.roberts@example.com" className="h-11 rounded-full bg-slate-50 border-transparent px-5 text-sm placeholder:text-slate-300" />
                <p className="text-[9px] text-orange-500 ml-2 mt-1">Please use your professional email address</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 ml-1">GitHub Link</Label>
                <Input placeholder="github.com/username" className="h-11 rounded-full bg-slate-50 border-transparent px-5 text-sm placeholder:text-slate-300" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 ml-1">Password</Label>
                <div className="relative">
                  <Input required type={showPassword ? "text" : "password"} placeholder="ZB0mLzLH7CU" className="h-11 rounded-full bg-slate-50 border-transparent px-5 pr-12 text-sm placeholder:text-slate-300" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700 ml-1">Confirm Password</Label>
                <Input required type={showPassword ? "text" : "password"} placeholder="••••••••••••" className="h-11 rounded-full bg-slate-50 border-transparent px-5 text-sm placeholder:text-slate-300" />
              </div>

              <div className="flex items-start gap-2 mt-6 mb-8 px-1">
                <input type="checkbox" required className="mt-1 h-[14px] w-[14px] rounded-sm border-gray-300 text-[#1D4ED8]" />
                <p className="text-[11px] text-slate-500 leading-tight">
                  I agree to the <span className="text-[#1D4ED8] font-medium">Terms & Conditions</span> and <span className="text-[#1D4ED8] font-medium">Privacy Policy</span>
                </p>
              </div>

              <Button type="submit" className="h-12 w-full rounded-full bg-[#1D4ED8] text-base font-semibold hover:bg-blue-700 shadow-md shadow-blue-500/20">
                Create Account
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* DESKTOP FLOW (kept split screen as per previous request, since user only complained about mobile) */}
      <div className="hidden md:flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-black/5 md:grid-cols-[1fr_1.1fr]">
          <div className="hidden flex-col justify-between bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#FBCFE8] p-10 text-white md:flex">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-white/90">Noospace</span>
            </div>
            <div className="pb-8">
              <p className="text-sm font-medium text-white/80">You can easily</p>
              <h2 className="mt-2 text-[32px] font-bold leading-tight tracking-tight">
                Get access your personal hub for clarity and productivity
              </h2>
            </div>
          </div>

          <div className="flex min-h-[650px] flex-col justify-center px-6 py-8 sm:px-12 sm:py-10">
            <div className="mb-4">
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {desktopMode === "login" ? "Welcome back" : "Create an account"}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {desktopMode === "login"
                  ? "Log in to pick up where your team left off."
                  : "Access your tasks, notes, and projects anytime, anywhere - and keep everything flowing in one place."}
              </p>
            </div>

            <form
              className="space-y-3"
              onSubmit={desktopMode === "login" ? handleLogin : handleSignup}
            >
              {desktopMode === "signup" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">Your name</Label>
                    <Input required placeholder="Anna Morgan" className="h-11 rounded-full px-4" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">GitHub link</Label>
                    <Input placeholder="https://github.com/username" className="h-11 rounded-full px-4" />
                  </div>
                </>
              ) : null}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Your email</Label>
                <Input required type="email" placeholder="farazhaidet786@gmail.com" className="h-11 rounded-full px-4" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">Password</Label>
                <div className="relative">
                  <Input required type={showPassword ? "text" : "password"} placeholder="••••••••••" className="h-11 rounded-full px-4 pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="h-11 w-full rounded-full bg-[#4F46E5] text-base font-semibold hover:bg-[#4338CA]">
                Get Started
              </Button>
            </form>

            <div className="relative mt-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-slate-400">or continue with</span>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <Button type="button" variant="outline" className="h-11 w-full rounded-full border-slate-200 bg-slate-100/50 hover:bg-slate-100">
                <span className="font-bold text-red-500">G</span>
                <span className="ml-2 font-medium text-slate-700">Continue with Google</span>
              </Button>
            </div>

            <p className="mt-5 text-center text-sm font-medium text-slate-500">
              {desktopMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-[#4F46E5] hover:underline"
                onClick={() => setMode(desktopMode === "login" ? "signup" : "login")}
              >
                {desktopMode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}