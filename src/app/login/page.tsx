"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Coffee, ShieldCheck, User, Sparkles, AlertCircle, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("from") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Route based on role
      if (data.user.role === "GM") {
        router.push(fromUrl !== "/" ? fromUrl : "/admin/dashboard");
      } else if (data.user.role === "STAFF") {
        router.push(fromUrl !== "/" ? fromUrl : "/staff/dashboard");
      } else {
        router.push(fromUrl !== "/" ? fromUrl : "/");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo1234");
    setError(null);
  };

  return (
    <div className="w-full max-w-md bg-white border border-[#ebded2] rounded-2xl shadow-xl p-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#384432] text-white mb-3 shadow-md">
          <Coffee className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-[#2f392b]">The Estate Resort</h1>
        <p className="text-xs uppercase tracking-widest text-[#7e5241] mt-1 font-medium">
          Chikkamagaluru • Karnataka
        </p>
        <p className="text-sm text-stone-500 mt-2">
          Sign in to access your bookings or resort operations
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. staff@estate.com"
            className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#546a4a] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#546a4a] text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 transition"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#384432] hover:bg-[#2f392b] text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm mt-2"
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>

      {/* Reviewer 1-Click Fast Fill Section */}
      <div className="mt-8 pt-6 border-t border-stone-200">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7e5241] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Reviewer 1-Click Demo Accounts</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => quickFill("guest@estate.com")}
            className="px-2 py-2 text-xs bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-300 transition text-center flex flex-col items-center gap-1"
          >
            <User className="w-3.5 h-3.5 text-stone-600" />
            <span className="font-semibold">Guest</span>
          </button>
          <button
            type="button"
            onClick={() => quickFill("staff@estate.com")}
            className="px-2 py-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded border border-emerald-300 transition text-center flex flex-col items-center gap-1"
          >
            <Coffee className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-semibold">Staff</span>
          </button>
          <button
            type="button"
            onClick={() => quickFill("gm@estate.com")}
            className="px-2 py-2 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 rounded border border-amber-300 transition text-center flex flex-col items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span className="font-semibold">GM</span>
          </button>
        </div>
        <p className="text-[11px] text-stone-400 mt-2 text-center">
          Default password for all demo accounts: <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">demo1234</code>
        </p>
      </div>

      <div className="mt-6 text-center space-y-2">
        <p className="text-xs text-stone-600">
          New guest?{" "}
          <Link href="/register" className="font-semibold text-[#546a4a] hover:underline">
            Create an account
          </Link>
        </p>
        <div>
          <Link href="/" className="text-xs text-stone-400 hover:text-stone-700 underline">
            ← Return to Resort Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#f5efe8] to-[#fbf8f5]">
      <Suspense fallback={<div className="text-xs text-stone-500">Loading portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
