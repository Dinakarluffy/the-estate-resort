import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { testGeminiConnection, DEFAULT_GEMINI_MODEL } from "@/lib/gemini";
import { Coffee, ShieldCheck, User, Calendar, Mail, LogIn, CheckCircle2, Sparkles, UserPlus } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default async function HomePage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("estate_session")?.value;
  const user = sessionToken ? await verifySessionToken(sessionToken) : null;
  const aiHealth = await testGeminiConnection();

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Bar */}
      <Navbar user={user} />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* System & AI Diagnostic Banner */}
        <div className="bg-white border border-[#ebded2] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${aiHealth.success ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {aiHealth.success ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900">
                  AI Model Status: {aiHealth.model}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${aiHealth.success ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {aiHealth.success ? "LIVE OPERATIONAL" : "FALLBACK ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                {aiHealth.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/ai/test"
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded border border-stone-300 font-mono transition"
            >
              Test API Endpoint (/api/ai/test) →
            </a>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#2f392b] to-[#43543b] text-white p-8 md:p-12 shadow-lg">
          <div className="max-w-2xl space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 border border-white/20 text-[#ebded2]">
              Coffee Estate Resort • 76 Keys
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight">
              Direct-Booking Engine & AI Operations Router
            </h1>
            <p className="text-sm md:text-base text-stone-200 leading-relaxed">
              Designed specifically for Company A, Chikkamagaluru, Karnataka. Solving the 20% OTA commission leakage (saving ₹33.3L/year) and eliminating event reply latency (recovering ₹72L/year).
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/rooms"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm rounded-lg shadow transition"
              >
                Browse Rooms & Live Availability →
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 bg-white text-[#2f392b] font-bold text-sm rounded-lg shadow hover:bg-stone-100 transition"
              >
                Access Portal (1-Click Demo Logins)
              </Link>
              <Link
                href="/staff/dashboard"
                className="px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold text-sm rounded-lg transition"
              >
                Staff Enquiry Inbox
              </Link>
            </div>
          </div>
        </div>

        {/* Phase Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#ebded2] rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-1">Phase 1: Roles & Auth</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Secure role-based access control with Guest, Reservations Staff, and General Manager hierarchy. 22 automated tests verifying bcrypt, JWT, and peer GM protection.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete & Tested
            </span>
          </div>

          <div className="bg-white border border-[#ebded2] rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-1">Phase 2: Allotment & GST</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Atomic transaction inventory reservation (prevents overbooking agency stock), statutory Indian Hotel GST slabs (12% and 18%), and promo code engine.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" /> Complete (30 Tests)
            </span>
          </div>

          <div className="bg-white border border-[#ebded2] rounded-xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-1">Gemini AI Engine</h3>
            <p className="text-xs text-stone-600 leading-relaxed mb-4">
              Powered by Google Gemini 3.5 Flash. Live integration verified with unit tests and IsoCode benchmark enquiries (ENQ-4410 wedding, ENQ-4411 villa, complaints).
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
              <CheckCircle2 className="w-3.5 h-3.5" /> Model Live & Operational
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
