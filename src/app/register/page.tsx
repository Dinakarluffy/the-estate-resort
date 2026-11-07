"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Coffee, UserPlus, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Successful registration & auto-login -> redirect home
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#f5efe8] to-[#fbf8f5]">
      <div className="w-full max-w-md bg-white border border-[#ebded2] rounded-2xl shadow-xl p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#384432] text-white mb-3 shadow-md">
            <Coffee className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#2f392b]">Create Guest Account</h1>
          <p className="text-xs uppercase tracking-widest text-[#7e5241] mt-1 font-medium">
            The Estate Resort • Chikkamagaluru
          </p>
          <p className="text-xs text-stone-500 mt-2">
            Direct-booking guest profile with instant confirmation & member perks
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#546a4a] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. priya.sharma@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#546a4a] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Mobile Number (Optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#546a4a] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6+ chars"
                  className="w-full pl-3 pr-8 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#546a4a] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2.5 text-stone-400 hover:text-stone-700 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Confirm *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat"
                  className="w-full pl-3 pr-8 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#546a4a] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-2.5 text-stone-400 hover:text-stone-700 transition"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Reassurance */}
          <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-500 flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-600 shrink-0 mt-0.5" />
            <span>
              <strong>Direct Booking Privacy:</strong> We only collect basic contact details to confirm your stays. Identity verification is conducted in-person at check-in.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#384432] hover:bg-[#2f392b] text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm mt-2 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? "Creating Account..." : "Create Account & Sign In"}</span>
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-stone-200 text-center text-xs text-stone-600 space-y-2">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#546a4a] hover:underline">
              Sign In here
            </Link>
          </p>
          <p>
            <Link href="/" className="text-stone-400 hover:text-stone-700 underline">
              ← Return to Resort Homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
