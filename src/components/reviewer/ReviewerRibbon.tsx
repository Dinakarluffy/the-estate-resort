"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Coffee,
  User,
  Activity,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";

interface ReviewerRibbonProps {
  aiHealth: {
    success: boolean;
    model: string;
    message: string;
  };
  currentUser: {
    userId: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

export function ReviewerRibbon({ aiHealth, currentUser }: ReviewerRibbonProps) {
  const [collapsed, setCollapsed] = useState(false);
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
        // Authoritative redirect to target role console
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

  if (collapsed) {
    return (
      <aside aria-label="Reviewer Toolkit Panel" className="bg-stone-900 text-stone-200 border-b border-stone-800 text-xs py-1.5 px-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="font-semibold text-amber-300 tracking-wide uppercase text-[10px]">
            Reviewer Toolkit
          </span>
          <span className="text-stone-400 hidden sm:inline">•</span>
          <span className="text-stone-300 hidden sm:inline">
            Active: <strong className="text-white">{currentUser ? `${currentUser.name} (${currentUser.role})` : "Guest Browsing"}</strong>
          </span>
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-white px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 transition"
        >
          <span>Expand Reviewer Console</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Reviewer Toolkit Panel" className="bg-stone-950 text-stone-200 border-b border-amber-900/40 text-xs py-2 px-4 sticky top-0 z-50 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Evaluator Badge & AI Diagnostics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-md text-amber-300 font-bold tracking-wider text-[11px] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Evaluator Launchpad</span>
          </div>

          {/* AI Model Status */}
          <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-md">
            <span className="text-stone-400">AI Router:</span>
            <span className="font-mono text-stone-200 font-medium">gemini-3.5-flash</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                aiHealth.success
                  ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
                  : "bg-amber-900/60 text-amber-300 border border-amber-700"
              }`}
            >
              {aiHealth.success ? "Live" : "Fallback Active"}
            </span>
          </div>

          {/* Health & Diagnostic API Links */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="/api/health?detailed=true"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-amber-300 transition"
              title="Inspect zero-auth JSON diagnostics: 76 keys capacity, database latency, and allotment invariant check"
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>/api/health</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
            <span className="text-stone-700">•</span>
            <a
              href="/api/ai/test"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-amber-300 transition"
              title="Test Google Gemini live connectivity and heuristic fallback"
            >
              <span>/api/ai/test</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          </div>
        </div>

        {/* Right: 1-Click Role Switchers & Hide Button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-stone-400 text-[11px] font-medium hidden sm:inline">1-Click Demo:</span>

          {/* 1-Click Guest */}
          <button
            onClick={() => switchAccount("guest@estate.com", "GUEST", "/")}
            disabled={switching !== null}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition border ${
              currentUser?.role === "GUEST"
                ? "bg-stone-200 text-stone-900 border-white shadow-sm"
                : "bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-700 hover:text-white"
            }`}
          >
            <User className="w-3 h-3 text-sky-400" />
            <span>{switching === "GUEST" ? "Loading..." : "Guest"}</span>
            {currentUser?.role === "GUEST" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          </button>

          {/* 1-Click Staff */}
          <button
            onClick={() => switchAccount("staff@estate.com", "STAFF", "/staff/dashboard")}
            disabled={switching !== null}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition border ${
              currentUser?.role === "STAFF"
                ? "bg-emerald-600 text-white border-emerald-400 shadow-sm"
                : "bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-800/80"
            }`}
          >
            <Coffee className="w-3 h-3 text-emerald-400" />
            <span>{switching === "STAFF" ? "Loading..." : "Staff Inbox"}</span>
            {currentUser?.role === "STAFF" && <CheckCircle2 className="w-3 h-3 text-white" />}
          </button>

          {/* 1-Click GM */}
          <button
            onClick={() => switchAccount("gm@estate.com", "GM", "/admin/rates")}
            disabled={switching !== null}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition border ${
              currentUser?.role === "GM"
                ? "bg-amber-600 text-white border-amber-400 shadow-sm"
                : "bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border-amber-800/80"
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            <span>{switching === "GM" ? "Loading..." : "GM Rates"}</span>
            {currentUser?.role === "GM" && <CheckCircle2 className="w-3 h-3 text-white" />}
          </button>

          {/* Collapse Ribbon Button */}
          <button
            onClick={() => setCollapsed(true)}
            className="text-stone-400 hover:text-white p-1 rounded hover:bg-stone-800 transition ml-1"
            title="Collapse Reviewer Ribbon to view site purely as a guest"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
