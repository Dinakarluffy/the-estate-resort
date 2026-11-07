"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  MessageSquare,
  Mail,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Calendar,
  Building2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface AIResponseData {
  enquiryNumber: string;
  category: string;
  confidenceScore: number;
  extractedDates: string | null;
  extractedGuests: number | null;
  assignedRole: string;
  draftReply: string;
  requiresGmReview: boolean;
}

export function EventEnquiryWizard() {
  const [source, setSource] = useState<"WEB" | "EMAIL" | "WHATSAPP">("WEB");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AIResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1-Click Benchmark Presets from IsoCode Assessment Brief
  const applyPreset = (type: "wedding" | "offsite" | "room" | "complaint" | "unsorted") => {
    switch (type) {
      case "wedding":
        setSource("WEB");
        setGuestName("Ananya Sharma");
        setGuestEmail("ananya.wedding@example.com");
        setGuestPhone("+91 98765 12345");
        setMessage("Looking for a venue for my sister's destination wedding with about 250 guests in February 2027. We would need lawns, banquet catering, and complete villa buyouts.");
        break;
      case "offsite":
        setSource("EMAIL");
        setGuestName("Karan Mehta (Razorpay)");
        setGuestEmail("karan.mehta@techcorp.com");
        setGuestPhone("+91 98111 22334");
        setMessage("Hi Team, planning our annual leadership offsite for a team of 45 attendees in January 2027. We require high-speed WiFi, conference hall with projector, and coffee estate trail treks.");
        break;
      case "room":
        setSource("WHATSAPP");
        setGuestName("Dr. Vikram Rathore");
        setGuestEmail("vikram.rathore@gmail.com");
        setGuestPhone("+91 94444 55555");
        setMessage("Hello, is a coffee estate pool villa free 14-16 November for 2 adults and 1 child? Please let me know the best direct booking tariff.");
        break;
      case "complaint":
        setSource("WHATSAPP");
        setGuestName("Guest in Villa 104");
        setGuestEmail("staying.guest@resort.com");
        setGuestPhone("+91 99999 88888");
        setMessage("AC in my room 104 is not working, very hot and leaking water! Extremely poor service, please send someone immediately. Urgent complaint!");
        break;
      case "unsorted":
        setSource("WEB");
        setGuestName("Vague Inquirer");
        setGuestEmail("curious@yahoo.com");
        setGuestPhone("+91 91234 56789");
        setMessage("Can you help me? Need some information.");
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write an enquiry message");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          rawMessage: message,
          guestName: guestName || "Prospective Guest",
          guestEmail: guestEmail || null,
          guestPhone: guestPhone || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit enquiry");

      setResult(data.enquiry);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Reviewer Benchmark Presets Toolbar */}
      <div className="bg-white border border-[#ebded2] rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              IsoCode Reviewer 1-Click AI Test Benchmarks
            </span>
          </div>
          <span className="text-[11px] text-stone-400 font-mono">
            Auto-fills assessment test scenarios
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset("wedding")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 transition flex items-center gap-1.5"
          >
            <span>🎊 Wedding (250 Pax)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("offsite")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1.5"
          >
            <span>💼 Offsite (45 Pax)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("room")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5"
          >
            <span>🛏️ Villa Query (2A+1C)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("complaint")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-900 border border-red-200 hover:bg-red-100 transition flex items-center gap-1.5"
          >
            <span>⚠️ AC Broken (GM Alert)</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("unsorted")}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition flex items-center gap-1.5"
          >
            <span>🤷 Vague (&lt;0.70 GM Queue)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Form Card */}
      <div className="bg-white border border-[#ebded2] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Channel Selector */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
            Select Lead Ingestion Channel
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSource("WEB")}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                source === "WEB"
                  ? "bg-[#384432] text-white border-[#384432] shadow-sm"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Website Form</span>
            </button>

            <button
              type="button"
              onClick={() => setSource("EMAIL")}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                source === "EMAIL"
                  ? "bg-blue-800 text-white border-blue-800 shadow-sm"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Forwarded Email</span>
            </button>

            <button
              type="button"
              onClick={() => setSource("WHATSAPP")}
              className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                source === "WHATSAPP"
                  ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                  : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Simulated WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Guest Details Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ananya Sharma"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. ananya@example.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Enquiry Details / Message Body *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Tell us about your wedding dates, corporate offsite group size, or stay preferences..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432] leading-relaxed"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>AI Lead Routing SLA: &lt; 2 Minutes</span>
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-[#384432] hover:bg-[#283224] text-white rounded-xl font-bold shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{submitting ? "Processing AI Classification..." : "Submit Enquiry & Run Gemini AI"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live AI Classification Result Card */}
      {result && (
        <div className="bg-white border-2 border-emerald-600/60 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-sm">
                AI
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Enquiry Registered: {result.enquiryNumber}
                </h3>
                <p className="text-xs text-stone-500">
                  Processed in real-time by Google Gemini 3.5 Flash router
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Dispatched to Staff Inbox
            </span>
          </div>

          {/* AI Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Classified Category</span>
              <strong className="text-stone-900 text-sm mt-0.5 block">{result.category}</strong>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Confidence Score</span>
              <strong className="text-emerald-700 text-sm mt-0.5 block">
                {Math.round(result.confidenceScore * 100)}% Match
              </strong>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Extracted Dates</span>
              <strong className="text-stone-900 mt-0.5 block font-mono">
                {result.extractedDates || "Flexible / Not Stated"}
              </strong>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Guests / Pax</span>
              <strong className="text-stone-900 mt-0.5 block font-mono">
                {result.extractedGuests ? `${result.extractedGuests} Guests` : "Not specified"}
              </strong>
            </div>
          </div>

          {/* AI Grounded Draft Quotation Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Grounded Draft Reply Preview (Human Review Pending)
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                Grounded in active resort tariffs
              </span>
            </div>
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-stone-800 whitespace-pre-line leading-relaxed font-sans">
              {result.draftReply}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
            <span className="text-stone-500">
              Staff reviewer will inspect and click "Approve & Send" in the Staff Operations Portal.
            </span>
            <a
              href="/staff/dashboard"
              className="text-[#384432] font-bold hover:underline flex items-center gap-1"
            >
              <span>Open Staff Inbox →</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
