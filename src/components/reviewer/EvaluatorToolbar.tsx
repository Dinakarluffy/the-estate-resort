"use client";

import { useState } from "react";
import { Sparkles, User, Coffee, ShieldCheck, Activity, ExternalLink, CheckCircle2 } from "lucide-react";

interface EvaluatorToolbarProps {
  aiHealth: {
    success: boolean;
    model: string;
    message: string;
  };
  currentUser: {
    name: string;
    role: string;
    email: string;
  } | null;
}

export function EvaluatorToolbar({ aiHealth, currentUser }: EvaluatorToolbarProps) {
  const [switching, setSwitching] = useState<string | null>(null);

  const switchAccount = async (email: string, targetRole: string, defaultPath: string) => {
    setSwitching(targetRole);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "demo1234" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = defaultPath;
      } else {
        alert(data.error || "Login switch failed");
        setSwitching(null);
      }
    } catch (err: any) {
      alert("Error switching account: " + err.message);
      setSwitching(null);
    }
  };

  return (
    <div className="bg-white border border-[#ebded2] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        {/* Left: Evaluator Title & AI Model Diagnostics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Evaluator Showcase</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-700 bg-stone-50 px-3 py-1 rounded-md border border-stone-200">
            <span className="text-stone-500">AI Router:</span>
            <span className="font-mono font-semibold text-stone-900">gemini-3.5-flash</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                aiHealth.success
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {aiHealth.success ? "Live" : "Fallback Active"}
            </span>
          </div>

          {/* Diagnostics Links */}
          <div className="hidden sm:flex items-center gap-2 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200 text-xs font-mono">
            <a
              href="/api/health?detailed=true"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-stone-700 hover:text-emerald-700 transition"
              title="Inspect zero-config JSON health diagnostics (76 keys audit, database latency, allotment check)"
            >
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>/api/health</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
            <span className="text-stone-300">|</span>
            <a
              href="/api/ai/test"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-stone-700 hover:text-amber-700 transition"
              title="Test Google Gemini live connection & entity extraction"
            >
              <span>/api/ai/test</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
          </div>
        </div>

        {/* Right: 1-Click Demo Accounts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            1-Click Demo Switcher:
          </span>

          {/* Guest */}
          <button
            type="button"
            onClick={() => switchAccount("guest@estate.com", "GUEST", "/")}
            disabled={switching !== null}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
              currentUser?.role === "GUEST"
                ? "bg-[#384432] text-white border-[#384432] shadow-xs"
                : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300"
            }`}
          >
            <User className="w-3 h-3 text-sky-600" />
            <span>{switching === "GUEST" ? "Loading..." : "Guest (Priya)"}</span>
            {currentUser?.role === "GUEST" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>

          {/* Staff */}
          <button
            type="button"
            onClick={() => switchAccount("staff@estate.com", "STAFF", "/staff/dashboard")}
            disabled={switching !== null}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
              currentUser?.role === "STAFF"
                ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
            }`}
          >
            <Coffee className="w-3 h-3 text-emerald-700" />
            <span>{switching === "STAFF" ? "Loading..." : "Staff (Karthik)"}</span>
            {currentUser?.role === "STAFF" && <CheckCircle2 className="w-3 h-3 text-white" />}
          </button>

          {/* GM */}
          <button
            type="button"
            onClick={() => switchAccount("gm@estate.com", "GM", "/admin/rates")}
            disabled={switching !== null}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
              currentUser?.role === "GM"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-amber-700" />
            <span>{switching === "GM" ? "Loading..." : "GM (Vikram)"}</span>
            {currentUser?.role === "GM" && <CheckCircle2 className="w-3 h-3 text-white" />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
        <div>
          Current Session: <strong className="text-stone-800">{currentUser ? `${currentUser.name} (${currentUser.role})` : "Guest Browsing (Unauthenticated)"}</strong>
        </div>
        <div className="text-[11px] text-stone-400">
          Default password for all demo accounts: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-stone-700">demo1234</code>
        </div>
      </div>
    </div>
  );
}
