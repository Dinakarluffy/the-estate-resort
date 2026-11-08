"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Archive,
  ArchiveRestore,
  Download,
  Phone,
  Clock,
  FileText,
  TrendingUp,
  Plus,
  X,
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
  internalNotes?: string | null;
  createdAt: string;
}

export function UnifiedEnquiryInbox() {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [draftText, setDraftText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Missing Phone Number Modal Prompt State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [inputPhone, setInputPhone] = useState("");
  const [phoneModalIntent, setPhoneModalIntent] = useState<"whatsapp" | "call" | "save">("whatsapp");

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/enquiries");
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.enquiries);
        if (data.enquiries.length > 0) {
          // If no selection or previously selected item is updated, keep current or pick first
          setSelectedEnquiry((prev) => {
            if (!prev) return data.enquiries[0];
            const found = data.enquiries.find((e: EnquiryItem) => e.id === prev.id);
            return found || data.enquiries[0];
          });
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

  // Sync draft and internal notes whenever selected enquiry changes
  useEffect(() => {
    if (selectedEnquiry) {
      setDraftText(selectedEnquiry.draftReply || "");
      setNoteText(selectedEnquiry.internalNotes || "");
      setIsEditingDraft(false);
    }
  }, [selectedEnquiry?.id]);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSelectEnquiry = (enquiry: EnquiryItem) => {
    setSelectedEnquiry(enquiry);
    setDraftText(enquiry.draftReply || "");
    setNoteText(enquiry.internalNotes || "");
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

  // Human-in-the-Loop: Approve & Dispatch via WhatsApp Web
  const handleApproveAndWhatsApp = async () => {
    if (!selectedEnquiry) return;

    // Edge case: If no phone number is provided, trigger modal prompt to enter number
    if (!selectedEnquiry.guestPhone || !selectedEnquiry.guestPhone.trim()) {
      setInputPhone("");
      setPhoneModalIntent("whatsapp");
      setShowPhoneModal(true);
      return;
    }

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
      if (!res.ok) throw new Error(data.error || "Failed to approve enquiry");

      // Safety guardrail: only open WhatsApp Web if it is a real number (not a mock placeholder)
      const cleanPhone = selectedEnquiry.guestPhone ? selectedEnquiry.guestPhone.replace(/\D/g, "") : "";
      const isMockNumber =
        cleanPhone === "9811122334" ||
        cleanPhone === "9876512345" ||
        cleanPhone === "9876543210" ||
        cleanPhone === "9444455555" ||
        cleanPhone === "9999988888" ||
        cleanPhone === "9123456789" ||
        cleanPhone.startsWith("0000") ||
        cleanPhone.startsWith("99999") ||
        cleanPhone.length < 10;

      if (cleanPhone && !isMockNumber) {
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(draftText)}`;
        window.open(waUrl, "_blank");
        showToast("success", `Approved & WhatsApp Web opened for ${selectedEnquiry.enquiryNumber}`);
      } else {
        showToast(
          "success",
          `Approved & logged as SENT! (WhatsApp launch safely skipped for mock/placeholder number to prevent messaging strangers)`
        );
      }

      setSelectedEnquiry(data.enquiry);
      fetchEnquiries();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save phone number entered via modal and proceed with action
  const handleSavePhoneAndProceed = async () => {
    if (!selectedEnquiry) return;
    const trimmed = inputPhone.trim();
    if (!trimmed || trimmed.length < 7) {
      showToast("error", "Please enter a valid phone number (at least 7 to 10 digits)");
      return;
    }

    const cleanPhone = trimmed.replace(/\D/g, "");
    const isMockNumber =
      cleanPhone === "9811122334" ||
      cleanPhone === "9876512345" ||
      cleanPhone === "9876543210" ||
      cleanPhone === "9444455555" ||
      cleanPhone === "9999988888" ||
      cleanPhone === "9123456789" ||
      cleanPhone.startsWith("0000") ||
      cleanPhone.startsWith("99999") ||
      cleanPhone.length < 10;

    setActionLoading(true);
    try {
      if (phoneModalIntent === "whatsapp") {
        const res = await fetch(`/api/staff/enquiries/${selectedEnquiry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approveAndSend",
            draftReply: draftText,
            guestPhone: trimmed,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update phone and approve enquiry");

        setShowPhoneModal(false);
        if (!isMockNumber) {
          const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(draftText)}`;
          window.open(waUrl, "_blank");
          showToast("success", `Phone saved & WhatsApp Web opened for ${selectedEnquiry.enquiryNumber}`);
        } else {
          showToast("success", `Phone saved & logged as SENT! (WhatsApp skipped for mock test number)`);
        }
        setSelectedEnquiry(data.enquiry);
        fetchEnquiries();
      } else {
        const res = await fetch(`/api/staff/enquiries/${selectedEnquiry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updatePhone",
            guestPhone: trimmed,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save phone number");

        setShowPhoneModal(false);
        showToast("success", `Phone number saved for ${selectedEnquiry.enquiryNumber}`);
        if (phoneModalIntent === "call" && !isMockNumber) {
          window.location.href = `tel:${trimmed}`;
        }
        setSelectedEnquiry(data.enquiry);
        fetchEnquiries();
      }
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

  // Save Draft Reply Changes
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

  // Save Internal Notes
  const handleSaveNotes = async () => {
    if (!selectedEnquiry) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/staff/enquiries/${selectedEnquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateNotes",
          internalNotes: noteText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save internal notes");

      showToast("success", `Internal notes saved for ${selectedEnquiry.enquiryNumber}`);
      setSelectedEnquiry(data.enquiry);
      fetchEnquiries();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Archive / Restore Enquiry
  const handleArchiveToggle = async (shouldArchive: boolean) => {
    if (!selectedEnquiry) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/staff/enquiries/${selectedEnquiry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive",
          archiveState: shouldArchive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update archive status");

      showToast(
        "success",
        shouldArchive
          ? `Enquiry ${selectedEnquiry.enquiryNumber} moved to Archive`
          : `Enquiry ${selectedEnquiry.enquiryNumber} restored to Active Inbox`
      );
      setSelectedEnquiry(data.enquiry);
      fetchEnquiries();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Export Sales Pipeline to CSV
  const handleExportPipelineCsv = () => {
    if (enquiries.length === 0) {
      showToast("error", "No enquiries available to export");
      return;
    }

    const headers = [
      "Enquiry Number",
      "Received Date",
      "Channel",
      "Category",
      "Guest Name",
      "Phone",
      "Email",
      "Pax / Guests",
      "Event Dates",
      "Est. Deal Value (INR)",
      "Status",
      "Assigned Role",
      "Requires GM Review",
      "Internal Notes",
      "Message Text"
    ];

    const rows = enquiries.map((item) => [
      `"${item.enquiryNumber}"`,
      `"${new Date(item.createdAt).toLocaleString("en-IN")}"`,
      `"${item.source}"`,
      `"${item.category}"`,
      `"${(item.guestName || "Prospective Guest").replace(/"/g, '""')}"`,
      `"${item.guestPhone || ""}"`,
      `"${item.guestEmail || ""}"`,
      `"${item.extractedGuests || "N/A"}"`,
      `"${(item.extractedDates || "N/A").replace(/"/g, '""')}"`,
      `"${getEstimatedDealValue(item.category, item.extractedGuests)}"`,
      `"${item.status}"`,
      `"${item.assignedRole}"`,
      `"${item.requiresGmReview ? "YES" : "NO"}"`,
      `"${(item.internalNotes || "").replace(/"/g, '""')}"`,
      `"${item.rawMessage.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `chikkamagaluru_resort_enquiries_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast("success", `Exported ${enquiries.length} enquiries to CSV`);
  };

  // Duplicate Check for Selected Enquiry
  const duplicateMatches = useMemo(() => {
    if (!selectedEnquiry) return [];
    return enquiries.filter((e) => {
      if (e.id === selectedEnquiry.id) return false;
      const phoneMatch =
        e.guestPhone &&
        selectedEnquiry.guestPhone &&
        e.guestPhone.replace(/\D/g, "").slice(-10) ===
          selectedEnquiry.guestPhone.replace(/\D/g, "").slice(-10);
      const emailMatch =
        e.guestEmail &&
        selectedEnquiry.guestEmail &&
        e.guestEmail.toLowerCase().trim() === selectedEnquiry.guestEmail.toLowerCase().trim();
      return Boolean(phoneMatch || emailMatch);
    });
  }, [selectedEnquiry, enquiries]);

  // Filtering Logic
  const filteredList = useMemo(() => {
    return enquiries.filter((e) => {
      // Archive tab separation
      if (selectedCategory === "ARCHIVED") {
        if (e.status !== "ARCHIVED") return false;
      } else {
        // Active view: hide archived leads by default
        if (e.status === "ARCHIVED") return false;

        if (selectedCategory === "GM_REVIEW") {
          if (!e.requiresGmReview) return false;
        } else if (selectedCategory !== "ALL") {
          if (e.category !== selectedCategory) return false;
        }
      }

      // Keyword Search
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;

      return (
        e.enquiryNumber.toLowerCase().includes(q) ||
        e.rawMessage.toLowerCase().includes(q) ||
        (e.guestName && e.guestName.toLowerCase().includes(q)) ||
        (e.guestEmail && e.guestEmail.toLowerCase().includes(q)) ||
        (e.guestPhone && e.guestPhone.includes(q))
      );
    });
  }, [enquiries, selectedCategory, searchTerm]);

  // Category Counts (active only, excluding archived)
  const activeEnquiries = enquiries.filter((e) => e.status !== "ARCHIVED");
  const weddingCount = activeEnquiries.filter((e) => e.category === "WEDDING").length;
  const offsiteCount = activeEnquiries.filter((e) => e.category === "OFFSITE").length;
  const roomCount = activeEnquiries.filter((e) => e.category === "ROOM").length;
  const complaintCount = activeEnquiries.filter((e) => e.category === "COMPLAINT").length;
  const gmReviewCount = activeEnquiries.filter((e) => e.requiresGmReview).length;
  const archivedCount = enquiries.filter((e) => e.status === "ARCHIVED").length;

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
              Gemini 3.5 Flash Unified AI Inbox & SLA Command
            </h2>
          </div>
          <p className="text-xs text-stone-300 mt-1 max-w-2xl">
            Multi-channel lead ingestion with sub-30 minute SLA response tracking, rate-grounded quotation drafting, and human-in-the-loop dispatch. <strong>Human-in-the-loop guarantee: AI never sends replies automatically.</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 px-3.5 py-1.5 rounded-xl text-center border border-white/10">
            <span className="text-[10px] uppercase text-stone-300 block font-bold">SLA Target</span>
            <strong className="text-sm font-mono text-emerald-300">&lt; 30 Mins</strong>
          </div>
          <div className="bg-white/10 px-3.5 py-1.5 rounded-xl text-center border border-white/10">
            <span className="text-[10px] uppercase text-stone-300 block font-bold">Pipeline Target</span>
            <strong className="text-sm font-mono text-amber-300">₹72L / Year</strong>
          </div>
        </div>
      </div>

      {/* Category Tabs & Controls Bar */}
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
            All Active ({activeEnquiries.length})
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

          {/* Archived Tab Filter */}
          <button
            onClick={() => setSelectedCategory("ARCHIVED")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedCategory === "ARCHIVED"
                ? "bg-stone-800 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived</span>
            <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-800 text-[10px]">
              {archivedCount}
            </span>
          </button>
        </div>

        {/* Right Action Bar: Search, Export CSV, Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search enquiries, pax, names..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#384432]"
            />
          </div>

          {/* 1-Click Export Enquiries to CSV */}
          <button
            onClick={handleExportPipelineCsv}
            className="px-3 py-1.5 bg-[#384432] text-white hover:bg-[#283224] rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            title="Export MICE & Room Leads to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

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
        <div className="lg:col-span-5 space-y-3 max-h-[820px] overflow-y-auto pr-1">
          {filteredList.length === 0 ? (
            <div className="bg-white border border-[#ebded2] rounded-2xl p-8 text-center text-stone-400 text-xs">
              No enquiries match the selected filter.
            </div>
          ) : (
            filteredList.map((item) => {
              const isSelected = selectedEnquiry?.id === item.id;
              const sla = getSlaIndicator(item.createdAt, item.status);
              const dealValue = getEstimatedDealValue(item.category, item.extractedGuests);

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectEnquiry(item)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs space-y-2.5 relative ${
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
                  {/* Top Meta Line: Reference, Channel, Status */}
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

                    <div className="flex items-center gap-1.5">
                      {item.internalNotes && (
                        <span
                          title="Internal Note Attached"
                          className="p-1 rounded bg-amber-50 text-amber-700 border border-amber-200"
                        >
                          <FileText className="w-3 h-3" />
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          item.status === "SENT"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "REVIEWED"
                            ? "bg-blue-100 text-blue-800"
                            : item.status === "ARCHIVED"
                            ? "bg-stone-200 text-stone-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Category, Estimated Deal Value, SLA Badge */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CategoryBadge category={item.category} />

                    {dealValue && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {dealValue}
                      </span>
                    )}

                    {/* SLA Timer Pill */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 ${sla.className}`}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>{sla.label}</span>
                    </span>
                  </div>

                  {/* Message Preview */}
                  <p className="text-stone-700 line-clamp-2 leading-relaxed">
                    "{item.rawMessage}"
                  </p>

                  {/* Guest Contact & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1.5 border-t border-stone-100">
                    <span className="font-semibold text-stone-600 truncate max-w-[180px]">
                      {item.guestName || "Prospective Guest"}
                    </span>
                    <span className="font-mono text-[10px]">
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
              {/* Header Info & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif font-bold text-xl text-stone-900">
                      {selectedEnquiry.enquiryNumber}
                    </h3>
                    <CategoryBadge category={selectedEnquiry.category} />
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
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

                  <p className="text-xs text-stone-500 mt-1.5 flex flex-wrap items-center gap-2">
                    <span>From: <strong className="text-stone-800">{selectedEnquiry.guestName}</strong></span>
                    {selectedEnquiry.guestEmail && <span>• {selectedEnquiry.guestEmail}</span>}
                    {selectedEnquiry.guestPhone ? (
                      <span>• {selectedEnquiry.guestPhone}</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-stone-400">
                        • <em>No phone number on record</em>
                        <button
                          type="button"
                          onClick={() => {
                            setInputPhone("");
                            setPhoneModalIntent("save");
                            setShowPhoneModal(true);
                          }}
                          className="text-emerald-700 hover:text-emerald-800 font-bold underline text-[11px] flex items-center gap-0.5 ml-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Phone</span>
                        </button>
                      </span>
                    )}
                  </p>

                  {/* Quick Contact Links: Call & WhatsApp */}
                  {selectedEnquiry.guestPhone ? (
                    (() => {
                      const cleanPhone = selectedEnquiry.guestPhone.replace(/\D/g, "");
                      const isMockNumber =
                        cleanPhone === "9811122334" ||
                        cleanPhone === "9876512345" ||
                        cleanPhone === "9876543210" ||
                        cleanPhone === "9444455555" ||
                        cleanPhone === "9999988888" ||
                        cleanPhone === "9123456789" ||
                        cleanPhone.startsWith("0000") ||
                        cleanPhone.startsWith("99999") ||
                        cleanPhone.length < 10;

                      return (
                        <div className="flex items-center gap-2 mt-2">
                          <a
                            href={isMockNumber ? "#" : `tel:${selectedEnquiry.guestPhone}`}
                            onClick={(e) => {
                              if (isMockNumber) {
                                e.preventDefault();
                                showToast("error", "Dialer disabled for mock test phone number");
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium transition"
                          >
                            <Phone className="w-3 h-3 text-stone-600" />
                            <span>Call Guest</span>
                          </a>

                          <a
                            href={
                              isMockNumber
                                ? "#"
                                : `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                    draftText || selectedEnquiry.draftReply || ""
                                  )}`
                            }
                            onClick={(e) => {
                              if (isMockNumber) {
                                e.preventDefault();
                                showToast(
                                  "error",
                                  "WhatsApp Web disabled for mock test phone number. Enter a real number to test."
                                );
                              }
                            }}
                            target={isMockNumber ? undefined : "_blank"}
                            rel={isMockNumber ? undefined : "noopener noreferrer"}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition border border-emerald-200"
                            title="Open WhatsApp with approved reply pre-filled"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>Send via WhatsApp Web</span>
                          </a>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInputPhone("");
                          setPhoneModalIntent("call");
                          setShowPhoneModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] font-medium transition"
                        title="Enter guest phone number to call"
                      >
                        <Phone className="w-3 h-3 text-stone-500" />
                        <span>Call Guest (Enter #)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInputPhone("");
                          setPhoneModalIntent("whatsapp");
                          setShowPhoneModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition border border-emerald-200"
                        title="Enter guest phone number to send via WhatsApp Web"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>WhatsApp (Enter #)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Top Controls: Re-Route & Archive Toggle */}
                <div className="flex flex-col items-end gap-2">
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

                  {/* Archive / Restore Button */}
                  {selectedEnquiry.status === "ARCHIVED" ? (
                    <button
                      onClick={() => handleArchiveToggle(false)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-lg transition border border-stone-300"
                    >
                      <ArchiveRestore className="w-3 h-3" />
                      <span>Restore to Active Inbox</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchiveToggle(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-700 text-xs font-medium rounded-lg transition border border-stone-200"
                      title="Archive lead / dismiss spam"
                    >
                      <Archive className="w-3 h-3" />
                      <span>Archive Lead</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Duplicate Enquiry Warning Banner */}
              {duplicateMatches.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <strong>Duplicate Inquiry Alert:</strong> Found {duplicateMatches.length} previous inquiry from this contact ({duplicateMatches.map((d) => d.enquiryNumber).join(", ")}). Coordinate with sales desk to avoid sending conflicting quotations.
                  </div>
                </div>
              )}

              {/* Service Complaint Alert Banner */}
              {selectedEnquiry.category === "COMPLAINT" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-red-900 font-bold block">
                      ⚠️ Urgent Service Complaint Alert — GM Dispatched
                    </strong>
                    <span className="text-red-800">
                      Flagged as an urgent guest dissatisfaction issue. Escalated automatically to General Manager Vikram Hegde with immediate service engineer dispatch.
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
                      Ambiguous or incomplete enquiry details. Manual review required by Reservations GM before responding.
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

              {/* Extracted Entity Chips & Financial Pipeline Value */}
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                  AI Extracted Details & Estimated Pipeline Impact
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

                  {/* Estimated Deal Value Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-950 border border-amber-200 font-bold">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                    <span>Est. Deal: {getEstimatedDealValue(selectedEnquiry.category, selectedEnquiry.extractedGuests)}</span>
                  </div>

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
                  rows={7}
                  value={draftText}
                  onChange={(e) => {
                    setDraftText(e.target.value);
                    setIsEditingDraft(true);
                  }}
                  className="w-full p-4 border border-stone-300 rounded-xl text-xs text-stone-900 font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#384432] bg-white shadow-xs"
                  placeholder="AI-generated draft reply..."
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
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
                      onClick={handleApproveAndWhatsApp}
                      disabled={actionLoading}
                      className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      title={
                        selectedEnquiry.guestPhone
                          ? "Approve reply, log as SENT in database, and launch WhatsApp Web"
                          : "This enquiry has no phone number. Click to enter a phone number and launch WhatsApp Web"
                      }
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{selectedEnquiry.guestPhone ? "Approve & WhatsApp" : "Approve & WhatsApp (Add #)"}</span>
                    </button>

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

              {/* Private Staff & GM Collaboration Notes Section */}
              <div className="border-t border-stone-200 pt-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Private Staff & GM Collaboration Notes (Hidden from Guest)
                    </span>
                  </div>
                  {selectedEnquiry.internalNotes && (
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      ✓ Note Persisted
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add private staff notes (e.g. 'Guest requested pure Jain catering; Lawn B confirmed free on Feb 14; Followed up via phone call on 08 Nov')..."
                  className="w-full p-3 border border-stone-200 rounded-xl text-xs text-stone-800 bg-stone-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#384432]"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes || actionLoading}
                    className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3 h-3" />
                    <span>{isSavingNotes ? "Saving..." : "Save Note"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#ebded2] rounded-2xl p-12 text-center text-stone-400 text-xs">
              Select an enquiry from the left to view details, notes, and approve the AI draft.
            </div>
          )}
        </div>
      </div>

      {/* Missing Phone Number Alert Modal Dialog */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {phoneModalIntent === "call" ? (
                    <Phone className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-emerald-700" />
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    {phoneModalIntent === "call"
                      ? "Enter Phone Number to Call"
                      : phoneModalIntent === "whatsapp"
                      ? "Enter Phone for WhatsApp Dispatch"
                      : "Add Phone Number to Record"}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {selectedEnquiry?.enquiryNumber} • {selectedEnquiry?.guestName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              ⚠️ <strong>No Phone Number on Record:</strong> This enquiry does not contain a phone number. Enter a mobile number below to dispatch via WhatsApp Web or make a direct phone call.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">
                Guest Mobile Number <span className="text-stone-400 font-normal">(e.g. +91 98765 43210)</span>
              </label>
              <input
                type="tel"
                autoFocus
                placeholder="Enter mobile number..."
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSavePhoneAndProceed();
                  }
                }}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#384432]"
              />
              <p className="text-[11px] text-stone-400 italic">
                Tip: Enter your own phone number if you want to test receiving the message live!
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPhoneModal(false)}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePhoneAndProceed}
                disabled={actionLoading || !inputPhone.trim()}
                className="px-5 py-2 bg-[#384432] hover:bg-[#283224] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {phoneModalIntent === "whatsapp"
                    ? "Save & Open WhatsApp"
                    : phoneModalIntent === "call"
                    ? "Save & Call"
                    : "Save Number"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
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

function getSlaIndicator(createdAt: string, status: string): { label: string; className: string } {
  if (status === "SENT") {
    return {
      label: "Resolved",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold",
    };
  }

  if (status === "ARCHIVED") {
    return {
      label: "Archived",
      className: "bg-stone-100 text-stone-600 border-stone-200",
    };
  }

  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  const elapsedMins = Math.max(1, Math.round(elapsedMs / (1000 * 60)));

  if (elapsedMins < 15) {
    return {
      label: `${elapsedMins}m • SLA On Track`,
      className: "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium",
    };
  } else if (elapsedMins <= 30) {
    return {
      label: `${elapsedMins}m • SLA Warning`,
      className: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
    };
  } else {
    return {
      label: `⚠️ ${elapsedMins}m • SLA Breached`,
      className: "bg-red-50 text-red-900 border-red-300 font-bold",
    };
  }
}

function getEstimatedDealValue(category: string, pax?: number | null): string {
  switch (category) {
    case "WEDDING":
      if (pax && pax >= 200) return "Est. ₹18L – ₹25L";
      if (pax && pax >= 100) return "Est. ₹12L – ₹18L";
      return "Est. ₹12L – ₹20L";

    case "OFFSITE":
      if (pax && pax > 0) return `Est. ₹${Math.round(pax * 0.11)}L – ₹${Math.round(pax * 0.17)}L`;
      return "Est. ₹4.5L – ₹8.0L";

    case "ROOM":
      return "Est. ₹13k – ₹32k";

    case "COMPLAINT":
      return "Service SLA (Critical)";

    case "UNSORTED":
    default:
      return "Pending Qualification";
  }
}
