"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  Calendar,
  DollarSign,
  MessageSquare,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Edit3,
  Check,
} from "lucide-react";

interface EnquiryItem {
  id: string;
  enquiryNumber: string;
  source: string; // WEB | EMAIL | WHATSAPP
  rawMessage: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  category: "ROOM" | "WEDDING" | "OFFSITE" | "COMPLAINT" | "UNSORTED";
  confidenceScore: number;
  extractedDates: string | null;
  extractedGuests: number | null;
  extractedBudget: string | null;
  assignedRole: string;
  draftReply: string | null;
  isAiGenerated: boolean;
  requiresGmReview: boolean;
  status: string; // NEW | REVIEWED | SENT | ARCHIVED
  createdAt: string;
}

export function UnifiedEnquiryInbox() {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [draftText, setDraftText] = useState("");
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/enquiries");
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.enquiries);
        if (data.enquiries.length > 0 && !selectedEnquiry) {
          setSelectedEnquiry(data.enquiries[0]);
          setDraftText(data.enquiries[0].draftReply || "");
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Failed to load enquiries: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSelectEnquiry = (enquiry: EnquiryItem) => {
    setSelectedEnquiry(enquiry);
    setDraftText(enquiry.draftReply || "");
    setIsEditingDraft(false);
  };

  // Human-in-the-Loop: Approve & Send
  const handleApproveAndSend = async () => {
    if (!selectedEnquiry) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/staff/enquiries/${selectedEnquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approveAndSend",
          draftReply: draftText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve and send");

      showToast("success", `Reply approved & dispatched for ${selectedEnquiry.enquiryNumber}`);
      setSelectedEnquiry(data.enquiry);
      fetchEnquiries();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 1-Click Re-Route Category
  const handleReroute = async (newCategory: EnquiryItem["category"]) => {
    if (!selectedEnquiry) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/staff/enquiries/${selectedEnquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reroute",
          category: newCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reroute enquiry");

      showToast("success", `Re-routed ${selectedEnquiry.enquiryNumber} to ${newCategory}`);
      setSelectedEnquiry(data.enquiry);
      fetchEnquiries();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save Draft Changes
  const handleSaveDraft = async () => {
    if (!selectedEnquiry) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/staff/enquiries/${selectedEnquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateDraft",
          draftReply: draftText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save draft");

      showToast("success", "Draft quotation updated");
      setSelectedEnquiry(data.enquiry);
      setIsEditingDraft(false);
      fetchEnquiries();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering
  const filteredList = enquiries.filter((e) => {
    const matchesCat =
      selectedCategory === "ALL"
        ? true
        : selectedCategory === "GM_REVIEW"
        ? e.requiresGmReview
        : e.category === selectedCategory;

    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.enquiryNumber.toLowerCase().includes(q) ||
      e.rawMessage.toLowerCase().includes(q) ||
      (e.guestName && e.guestName.toLowerCase().includes(q)) ||
      (e.guestEmail && e.guestEmail.toLowerCase().includes(q));

    return matchesCat && matchesSearch;
  });

  const weddingCount = enquiries.filter((e) => e.category === "WEDDING").length;
  const offsiteCount = enquiries.filter((e) => e.category === "OFFSITE").length;
  const roomCount = enquiries.filter((e) => e.category === "ROOM").length;
  const complaintCount = enquiries.filter((e) => e.category === "COMPLAINT").length;
  const gmReviewCount = enquiries.filter((e) => e.requiresGmReview).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-600 text-xs uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SLA & AI Engine Header Notice */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#283224] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h2 className="font-serif font-bold text-lg">
              Gemini 3.5 Flash Unified AI Inbox
            </h2>
          </div>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            Auto-classifies multi-channel leads (&lt;2 min response time), extracts event dates and guest counts, and drafts rate-grounded quotations. <strong>Human-in-the-loop guarantee: AI never sends replies automatically.</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 px-3.5 py-1.5 rounded-xl text-center border border-white/10">
            <span className="text-[10px] uppercase text-stone-300 block font-bold">Latency</span>
            <strong className="text-sm font-mono text-emerald-300">&lt; 2 Minutes</strong>
          </div>
          <div className="bg-white/10 px-3.5 py-1.5 rounded-xl text-center border border-white/10">
            <span className="text-[10px] uppercase text-stone-300 block font-bold">Revenue Recovery</span>
            <strong className="text-sm font-mono text-amber-300">₹72L / Year</strong>
          </div>
        </div>
      </div>

      {/* Category Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === "ALL"
                ? "bg-[#384432] text-white shadow-xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            All Messages ({enquiries.length})
          </button>

          <button
            onClick={() => setSelectedCategory("WEDDING")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === "WEDDING"
                ? "bg-purple-900 text-white shadow-xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span>🎊 Weddings</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-900 text-[10px]">
              {weddingCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory("OFFSITE")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === "OFFSITE"
                ? "bg-blue-900 text-white shadow-xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span>💼 Corporate</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 text-[10px]">
              {offsiteCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory("ROOM")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === "ROOM"
                ? "bg-emerald-900 text-white shadow-xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span>🛏️ Rooms</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 text-[10px]">
              {roomCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory("COMPLAINT")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === "COMPLAINT"
                ? "bg-red-800 text-white shadow-xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span>⚠️ Complaints</span>
            <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-900 text-[10px]">
              {complaintCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory("GM_REVIEW")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === "GM_REVIEW"
                ? "bg-amber-800 text-white shadow-xs"
                : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>GM Review Queue</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 text-[10px]">
              {gmReviewCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search enquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#384432]"
            />
          </div>

          <button
            onClick={fetchEnquiries}
            disabled={loading}
            className="p-2 text-stone-500 hover:text-stone-800 bg-white border border-stone-200 rounded-xl transition"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main 2-Column Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Enquiries List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          {filteredList.length === 0 ? (
            <div className="bg-white border border-[#ebded2] rounded-2xl p-8 text-center text-stone-400 text-xs">
              No enquiries match the selected filter.
            </div>
          ) : (
            filteredList.map((item) => {
              const isSelected = selectedEnquiry?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectEnquiry(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs space-y-2 relative ${
                    isSelected
                      ? "bg-white border-[#384432] shadow-md ring-2 ring-[#384432]/20"
                      : "bg-white border-[#ebded2] hover:border-stone-400 hover:shadow-xs"
                  } ${
                    item.category === "COMPLAINT"
                      ? "border-l-4 border-l-red-600"
                      : item.requiresGmReview
                      ? "border-l-4 border-l-amber-500"
                      : ""
                  }`}
                >
                  {/* Top Meta Line */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900">
                        {item.enquiryNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          item.source === "WHATSAPP"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.source === "EMAIL"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {item.source}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        item.status === "SENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "REVIEWED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Category & Confidence Badge */}
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={item.category} />
                    <span className="text-[10px] text-stone-400 font-mono">
                      {Math.round(item.confidenceScore * 100)}% match
                    </span>
                    {item.requiresGmReview && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        GM Review
                      </span>
                    )}
                  </div>

                  {/* Message Preview */}
                  <p className="text-stone-700 line-clamp-2 leading-relaxed">
                    "{item.rawMessage}"
                  </p>

                  {/* Guest Contact & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-100">
                    <span className="font-semibold text-stone-600">
                      {item.guestName || "Prospective Guest"}
                    </span>
                    <span className="font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: AI Human-in-the-Loop Review Card (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedEnquiry ? (
            <div className="bg-white border border-[#ebded2] rounded-2xl shadow-sm p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-lg text-stone-900">
                      {selectedEnquiry.enquiryNumber}
                    </h3>
                    <CategoryBadge category={selectedEnquiry.category} />
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedEnquiry.source === "WHATSAPP"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedEnquiry.source === "EMAIL"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {selectedEnquiry.source} Channel
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    From: <strong className="text-stone-800">{selectedEnquiry.guestName}</strong>
                    {selectedEnquiry.guestEmail && ` • ${selectedEnquiry.guestEmail}`}
                    {selectedEnquiry.guestPhone && ` • ${selectedEnquiry.guestPhone}`}
                  </p>
                </div>

                {/* 1-Click Re-Route Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 font-bold">Re-Route:</span>
                  <select
                    value={selectedEnquiry.category}
                    onChange={(e) => handleReroute(e.target.value as any)}
                    disabled={actionLoading}
                    className="p-1.5 border border-stone-300 rounded-lg text-xs font-semibold bg-stone-50 text-stone-800 focus:outline-none"
                  >
                    <option value="WEDDING">🎊 Wedding</option>
                    <option value="OFFSITE">💼 Corporate Offsite</option>
                    <option value="ROOM">🛏️ Room Booking</option>
                    <option value="COMPLAINT">⚠️ Complaint (GM)</option>
                    <option value="UNSORTED">🤷 Unsorted (GM)</option>
                  </select>
                </div>
              </div>

              {/* Service Complaint Alert Banner if Category === COMPLAINT */}
              {selectedEnquiry.category === "COMPLAINT" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-red-900 font-bold block">
                      ⚠️ Urgent Service Complaint Alert — GM Dispatched
                    </strong>
                    <span className="text-red-800">
                      This enquiry was flagged as an urgent guest dissatisfaction issue. Escalated automatically to General Manager Vikram Hegde with immediate service engineer dispatch.
                    </span>
                  </div>
                </div>
              )}

              {/* Low-confidence Unsorted Banner */}
              {selectedEnquiry.category === "UNSORTED" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-amber-900 font-bold block">
                      🤷 Low Confidence (&lt;0.70) — Unsorted Lane
                    </strong>
                    <span className="text-amber-800">
                      The AI router detected ambiguous or incomplete details. Manual review required by Reservations GM before responding.
                    </span>
                  </div>
                </div>
              )}

              {/* Raw Incoming Message */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                  Original Message Received
                </span>
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed font-sans italic">
                  "{selectedEnquiry.rawMessage}"
                </div>
              </div>

              {/* Extracted Entity Chips */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  AI Extracted Details (Gemini 3.5 Flash)
                </span>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {selectedEnquiry.extractedDates ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Dates: {selectedEnquiry.extractedDates}</span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 text-stone-400 border border-dashed border-stone-200 rounded-xl text-[11px]">
                      Dates: Not specified
                    </span>
                  )}

                  {selectedEnquiry.extractedGuests ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 font-mono font-semibold">
                      <Users className="w-3.5 h-3.5 text-purple-700" />
                      <span>{selectedEnquiry.extractedGuests} Guests / Pax</span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 text-stone-400 border border-dashed border-stone-200 rounded-xl text-[11px]">
                      Guests: Not specified
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Confidence: {Math.round(selectedEnquiry.confidenceScore * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Editable Draft Quotation / Reply */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Rate-Grounded Draft Reply (Editable)
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono">
                    Pricing grounded in active resort tariffs
                  </span>
                </div>

                <textarea
                  rows={8}
                  value={draftText}
                  onChange={(e) => {
                    setDraftText(e.target.value);
                    setIsEditingDraft(true);
                  }}
                  className="w-full p-4 border border-stone-300 rounded-xl text-xs text-stone-900 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#384432] bg-white shadow-xs"
                  placeholder="AI-generated draft reply..."
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-stone-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Human Approval Required • AI Never Sends Automatically</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditingDraft && (
                      <button
                        onClick={handleSaveDraft}
                        disabled={actionLoading}
                        className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
                      >
                        Save Edits
                      </button>
                    )}

                    <button
                      onClick={handleApproveAndSend}
                      disabled={actionLoading}
                      className="px-5 py-2.5 bg-[#384432] hover:bg-[#283224] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{selectedEnquiry.status === "SENT" ? "Re-Send Reply" : "Approve & Send Reply"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#ebded2] rounded-2xl p-12 text-center text-stone-400 text-xs">
              Select an enquiry from the left to view details and approve the AI draft.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: EnquiryItem["category"] }) {
  switch (category) {
    case "WEDDING":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
          🎊 Wedding
        </span>
      );
    case "OFFSITE":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
          💼 Corporate Offsite
        </span>
      );
    case "ROOM":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
          🛏️ Room Stay
        </span>
      );
    case "COMPLAINT":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
          ⚠️ Complaint (GM Alert)
        </span>
      );
    case "UNSORTED":
    default:
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          🤷 Unsorted Lane
        </span>
      );
  }
}
