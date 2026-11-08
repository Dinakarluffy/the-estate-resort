"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  Lock,
  Tag,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Info,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/gst";

interface CalendarItem {
  date: string;
  pricePerNight: number;
  isCustomRate: boolean;
  websiteAllotment: number;
  bookedCount: number;
  availableKeys: number;
  isBlackout: boolean;
  blackoutReason?: string | null;
  blackoutId?: string | null;
}

interface RoomTypeMatrix {
  roomType: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    totalKeys: number;
    defaultAllotment: number;
  };
  calendar: CalendarItem[];
}

interface BlackoutItem {
  id: string;
  date: string;
  reason: string;
  roomTypeId: string | null;
  roomType?: { name: string } | null;
}

interface PromoItem {
  id: string;
  code: string;
  discountPercent: number;
  maxDiscount: number | null;
  minTariff: number | null;
  validFrom: string;
  validTo: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
}

interface BlackoutPrecondition {
  isResortWideBlocked: boolean;
  resortWideReason: string | null;
  isRoomTypeBlocked: boolean;
  roomTypeReason: string | null;
  roomTypeName: string | null;
  activeBookingsCount: number;
  activeBookings: { bookingNumber: string; guestName: string; roomType: string }[];
}

export function RateAllotmentManager() {
  const [activeTab, setActiveTab] = useState<"rates" | "blackouts" | "promos">("rates");
  const [loading, setLoading] = useState(true);
  const [matrix, setMatrix] = useState<RoomTypeMatrix[]>([]);
  const [blackouts, setBlackouts] = useState<BlackoutItem[]>([]);
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);

  // Notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Bulk rate modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRoomTypeId, setBulkRoomTypeId] = useState("");
  const [bulkStartDate, setBulkStartDate] = useState("");
  const [bulkEndDate, setBulkEndDate] = useState("");
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Custom Styled Blackout Modal State (Eliminating window.prompt)
  const [blackoutModal, setBlackoutModal] = useState<{
    isOpen: boolean;
    date: string;
    roomTypeId: string | null;
    roomTypeName: string;
    reason: string;
    isChecking: boolean;
    preconditions: BlackoutPrecondition | null;
    submitting: boolean;
  }>({
    isOpen: false,
    date: "",
    roomTypeId: null,
    roomTypeName: "Resort-Wide (All 76 Keys)",
    reason: "Estate Private Event",
    isChecking: false,
    preconditions: null,
    submitting: false,
  });

  // Custom Styled Delete Blackout Modal State (Eliminating window.confirm)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    date: string;
    reason: string;
    scopeName: string;
    submitting: boolean;
  }>({
    isOpen: false,
    id: "",
    date: "",
    reason: "",
    scopeName: "",
    submitting: false,
  });

  // Tab 2 Sidebar Form State & Precondition Live Check
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [newBlackoutRoomTypeId, setNewBlackoutRoomTypeId] = useState<string>("");
  const [newBlackoutReason, setNewBlackoutReason] = useState("");
  const [tab2Preconditions, setTab2Preconditions] = useState<BlackoutPrecondition | null>(null);
  const [tab2Checking, setTab2Checking] = useState(false);

  // Add Promo state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("10");
  const [promoMaxDiscount, setPromoMaxDiscount] = useState("");
  const [promoMinTariff, setPromoMinTariff] = useState("");
  const [promoValidFrom, setPromoValidFrom] = useState("");
  const [promoValidTo, setPromoValidTo] = useState("");
  const [promoMaxUses, setPromoMaxUses] = useState("100");

  const loadData = async () => {
    setLoading(true);
    try {
      const [matrixRes, blackoutRes, promoRes] = await Promise.all([
        fetch("/api/admin/rates"),
        fetch("/api/admin/blackout"),
        fetch("/api/admin/promos"),
      ]);

      const [matrixData, blackoutData, promoData] = await Promise.all([
        matrixRes.json(),
        blackoutRes.json(),
        promoRes.json(),
      ]);

      if (matrixData.success) {
        setMatrix(matrixData.matrix);
        if (matrixData.matrix.length > 0 && !bulkRoomTypeId) {
          setBulkRoomTypeId(matrixData.matrix[0].roomType.id);
        }
      }
      if (blackoutData.success) {
        setBlackouts(blackoutData.blackouts);
      }
      if (promoData.success) {
        setPromos(promoData.promos);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Failed to load admin matrix: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Precondition checker function
  const fetchPreconditions = async (date: string, roomTypeId: string | null): Promise<BlackoutPrecondition | null> => {
    if (!date) return null;
    try {
      const url = `/api/admin/blackout?checkDate=${date}&roomTypeId=${roomTypeId || ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) return data.preconditions;
      return null;
    } catch {
      return null;
    }
  };

  // Live check in Tab 2 sidebar form when date or roomType changes
  useEffect(() => {
    if (!newBlackoutDate) {
      setTab2Preconditions(null);
      return;
    }
    let isCancelled = false;
    setTab2Checking(true);
    fetchPreconditions(newBlackoutDate, newBlackoutRoomTypeId || null).then((prec) => {
      if (!isCancelled) {
        setTab2Preconditions(prec);
        setTab2Checking(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [newBlackoutDate, newBlackoutRoomTypeId]);

  // 1-Click Rate Save
  const handleSaveRate = async (roomTypeId: string, date: string, newRate: number) => {
    try {
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateRate",
          roomTypeId,
          date,
          pricePerNight: newRate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update rate");

      showToast("success", `Updated rate for ${date} to ${formatCurrency(newRate)}`);
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // 1-Click Allotment Save
  const handleSaveAllotment = async (roomTypeId: string, date: string, newAllotment: number) => {
    try {
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateAllotment",
          roomTypeId,
          date,
          websiteAllotment: newAllotment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update allotment");

      showToast("success", `Website allotment for ${date} updated to ${newAllotment} keys`);
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Open Custom Blackout Modal from Table Row (No native prompt!)
  const handleOpenBlackoutModalFromTable = async (
    roomTypeId: string,
    date: string,
    isBlackout: boolean,
    blackoutId?: string | null,
    blackoutReason?: string | null
  ) => {
    if (isBlackout && blackoutId) {
      // Open Delete Modal
      setDeleteModal({
        isOpen: true,
        id: blackoutId,
        date,
        reason: blackoutReason || "Scheduled Blackout",
        scopeName: matrix.find((m) => m.roomType.id === roomTypeId)?.roomType.name || "Room Blackout",
        submitting: false,
      });
      return;
    }

    // Open Schedule Modal
    const targetRoom = matrix.find((m) => m.roomType.id === roomTypeId);
    setBlackoutModal({
      isOpen: true,
      date,
      roomTypeId,
      roomTypeName: targetRoom?.roomType.name || "Selected Room",
      reason: "Estate Private Event",
      isChecking: true,
      preconditions: null,
      submitting: false,
    });

    const prec = await fetchPreconditions(date, roomTypeId);
    setBlackoutModal((prev) => ({ ...prev, isChecking: false, preconditions: prec }));
  };

  // Submit Schedule Blackout from Modal
  const handleConfirmBlackoutModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blackoutModal.date || !blackoutModal.reason.trim()) {
      showToast("error", "Please provide a reason for the blackout");
      return;
    }

    // Guard against redundant room blackout if already resort-wide
    if (blackoutModal.roomTypeId && blackoutModal.preconditions?.isResortWideBlocked) {
      showToast(
        "error",
        `Date ${blackoutModal.date} is already blocked Resort-Wide ("${blackoutModal.preconditions.resortWideReason}"). All rooms are already closed.`
      );
      return;
    }

    setBlackoutModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch("/api/admin/blackout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomTypeId: blackoutModal.roomTypeId,
          date: blackoutModal.date,
          reason: blackoutModal.reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule blackout");

      showToast("success", `Blackout scheduled for ${blackoutModal.date}`);
      setBlackoutModal((prev) => ({ ...prev, isOpen: false, submitting: false }));
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
      setBlackoutModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Confirm Delete Blackout from Modal (No native confirm!)
  const handleConfirmDeleteBlackout = async () => {
    if (!deleteModal.id) return;
    setDeleteModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch(`/api/admin/blackout?id=${deleteModal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove blackout");

      showToast("success", `Blackout removed for ${deleteModal.date}. Inventory re-opened.`);
      setDeleteModal({ isOpen: false, id: "", date: "", reason: "", scopeName: "", submitting: false });
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
      setDeleteModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // Bulk Rate Apply
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkRoomTypeId || !bulkStartDate || !bulkEndDate || !bulkPrice) {
      showToast("error", "Please fill in all bulk rate fields");
      return;
    }
    setBulkSubmitting(true);
    try {
      const res = await fetch("/api/admin/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulkUpdateRate",
          roomTypeId: bulkRoomTypeId,
          startDate: bulkStartDate,
          endDate: bulkEndDate,
          pricePerNight: Number(bulkPrice),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed bulk rate update");

      showToast("success", `Successfully updated ${data.count} dates to ${formatCurrency(Number(bulkPrice))}`);
      setShowBulkModal(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Add Blackout from Tab 2 Sidebar Form
  const handleAddBlackoutFromTab2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackoutDate || !newBlackoutReason.trim()) {
      showToast("error", "Please provide a date and reason");
      return;
    }

    // Real-world check: If date is already resort-wide blocked, block individual room duplication
    if (newBlackoutRoomTypeId && tab2Preconditions?.isResortWideBlocked) {
      showToast(
        "error",
        `Date ${newBlackoutDate} is already blocked Resort-Wide ("${tab2Preconditions.resortWideReason}"). All 76 rooms are already closed.`
      );
      return;
    }

    try {
      const res = await fetch("/api/admin/blackout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newBlackoutDate,
          roomTypeId: newBlackoutRoomTypeId || null,
          reason: newBlackoutReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add blackout");

      showToast("success", `Blackout scheduled for ${newBlackoutDate}`);
      setNewBlackoutDate("");
      setNewBlackoutReason("");
      setTab2Preconditions(null);
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Create Promo Code
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode || !promoValidFrom || !promoValidTo) {
      showToast("error", "Please provide code and validity dates");
      return;
    }
    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode,
          discountPercent: Number(promoDiscount),
          maxDiscount: promoMaxDiscount ? Number(promoMaxDiscount) : null,
          minTariff: promoMinTariff ? Number(promoMinTariff) : null,
          validFrom: promoValidFrom,
          validTo: promoValidTo,
          maxUses: Number(promoMaxUses),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create promo code");

      showToast("success", `Created promo code ${promoCode.toUpperCase()}`);
      setShowPromoModal(false);
      setPromoCode("");
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Toggle Promo Active
  const handleTogglePromo = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle promo code");

      showToast("success", `Promo code ${!currentActive ? "Activated" : "Deactivated"}`);
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  const selectedMatrix = matrix[selectedRoomIndex];

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("rates")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "rates"
                ? "bg-[#384432] text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>45-Day Rate & Allotment Grid</span>
          </button>

          <button
            onClick={() => setActiveTab("blackouts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "blackouts"
                ? "bg-[#384432] text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Blackout Dates ({blackouts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("promos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "promos"
                ? "bg-[#384432] text-white shadow-sm"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promo Codes ({promos.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "rates" && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Bulk Seasonal Surcharge</span>
            </button>
          )}
          {activeTab === "promos" && (
            <button
              onClick={() => setShowPromoModal(true)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Promo Voucher</span>
            </button>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 text-stone-500 hover:text-stone-800 bg-white border border-stone-200 rounded-xl transition"
            title="Refresh Allotment Matrix"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 1: 45-DAY RATE & ALLOTMENT GRID                                    */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "rates" && (
        <div className="space-y-6">
          {/* Room Type Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {matrix.map((m, idx) => (
              <button
                key={m.roomType.id}
                onClick={() => setSelectedRoomIndex(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 border ${
                  selectedRoomIndex === idx
                    ? "bg-[#e8ece6] text-[#222c1d] border-[#384432] shadow-sm ring-1 ring-[#384432]"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                }`}
              >
                <span>{m.roomType.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 font-mono text-stone-600">
                  {m.roomType.totalKeys} keys total • {m.roomType.defaultAllotment} direct
                </span>
              </button>
            ))}
          </div>

          {/* Room Summary Info Card */}
          {selectedMatrix && (
            <div className="bg-white border border-[#ebded2] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  {selectedMatrix.roomType.name} — Direct Allotment Matrix
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Resort Total: <strong className="text-stone-900">{selectedMatrix.roomType.totalKeys} Keys</strong> | 
                  Standard Direct Allotment: <strong className="text-stone-900">{selectedMatrix.roomType.defaultAllotment} Keys</strong> | 
                  Base Tariff: <strong className="text-stone-900">{formatCurrency(selectedMatrix.roomType.basePrice)}/night</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <span className="inline-block w-3 h-3 rounded-full bg-amber-400"></span>
                <span>Weekend Surcharge Active</span>
                <span className="inline-block w-3 h-3 rounded-full bg-red-400 ml-2"></span>
                <span>Blackout Date</span>
              </div>
            </div>
          )}

          {/* Interactive 45-Day Table */}
          {selectedMatrix && (
            <div className="bg-white border border-[#ebded2] rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#faf7f2] border-b border-[#ebded2] sticky top-0 z-20 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Stay Date</th>
                      <th className="py-3.5 px-4">Day of Week</th>
                      <th className="py-3.5 px-4">Nightly Rate (INR)</th>
                      <th className="py-3.5 px-4">Website Allotment</th>
                      <th className="py-3.5 px-4">Booked Keys</th>
                      <th className="py-3.5 px-4">Available Direct</th>
                      <th className="py-3.5 px-4 text-right">Blackout Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {selectedMatrix.calendar.map((day) => {
                      const dateObj = new Date(day.date);
                      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                      const isWeekend = dayName === "Fri" || dayName === "Sat";

                      return (
                        <tr
                          key={day.date}
                          className={`hover:bg-stone-50/80 transition ${
                            day.isBlackout
                              ? "bg-red-50/50"
                              : isWeekend
                              ? "bg-amber-50/30"
                              : ""
                          }`}
                        >
                          {/* Date */}
                          <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                            {day.date}
                          </td>

                          {/* Day */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isWeekend
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "text-stone-500"
                              }`}
                            >
                              {dayName} {isWeekend && "★ Peak"}
                            </span>
                          </td>

                          {/* Price Inline Editor */}
                          <td className="py-3 px-4">
                            <InlinePriceInput
                              initialValue={day.pricePerNight}
                              onSave={(newVal) =>
                                handleSaveRate(selectedMatrix.roomType.id, day.date, newVal)
                              }
                            />
                          </td>

                          {/* Allotment Inline Editor */}
                          <td className="py-3 px-4">
                            <InlineAllotmentInput
                              initialValue={day.websiteAllotment}
                              minAllowed={day.bookedCount}
                              onSave={(newVal) =>
                                handleSaveAllotment(selectedMatrix.roomType.id, day.date, newVal)
                              }
                            />
                          </td>

                          {/* Booked Keys */}
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                day.bookedCount > 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "text-stone-400"
                              }`}
                            >
                              {day.bookedCount} Booked
                            </span>
                          </td>

                          {/* Available Direct */}
                          <td className="py-3 px-4">
                            <strong
                              className={`font-mono text-sm ${
                                day.availableKeys === 0
                                  ? "text-red-600 font-bold"
                                  : "text-emerald-700"
                              }`}
                            >
                              {day.availableKeys} Keys Free
                            </strong>
                          </td>

                          {/* Blackout Actions (Triggering Custom Styled Modal) */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() =>
                                handleOpenBlackoutModalFromTable(
                                  selectedMatrix.roomType.id,
                                  day.date,
                                  day.isBlackout,
                                  day.blackoutId,
                                  day.blackoutReason
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                day.isBlackout
                                  ? "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                                  : "border border-stone-200 text-stone-600 hover:bg-stone-100"
                              }`}
                            >
                              {day.isBlackout ? `✕ Blocked (${day.blackoutReason || "Private"})` : "+ Blackout"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 2: BLACKOUT DATES MANAGEMENT                                       */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "blackouts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule Form */}
          <div className="bg-white border border-[#ebded2] p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-base border-b border-stone-100 pb-3">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Schedule New Blackout</span>
            </div>
            <p className="text-xs text-stone-500">
              Blackouts disable online direct bookings for resort buyouts, destination weddings, or routine maintenance.
            </p>

            <form onSubmit={handleAddBlackoutFromTab2} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Blackout Date</label>
                <input
                  type="date"
                  required
                  value={newBlackoutDate}
                  onChange={(e) => setNewBlackoutDate(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 font-mono focus:ring-2 focus:ring-[#384432] outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Applies To</label>
                <select
                  value={newBlackoutRoomTypeId}
                  onChange={(e) => setNewBlackoutRoomTypeId(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 focus:ring-2 focus:ring-[#384432] outline-none font-semibold"
                >
                  <option value="">Resort-Wide (All 76 Keys)</option>
                  {matrix.map((m) => (
                    <option key={m.roomType.id} value={m.roomType.id}>
                      {m.roomType.name} Only
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-World Conflict Warning in Tab 2 Form */}
              {tab2Checking && (
                <div className="text-[11px] text-stone-400 italic">Checking date availability...</div>
              )}

              {tab2Preconditions?.isResortWideBlocked && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-amber-950">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Resort-Wide Blackout Already Active</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    This date is already blocked resort-wide for <strong>"{tab2Preconditions.resortWideReason}"</strong>. All 76 rooms are already closed for online booking.
                  </p>
                  {newBlackoutRoomTypeId ? (
                    <p className="text-[10px] text-red-700 font-bold">
                      ✕ You cannot block an individual room type when the entire resort is already closed.
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-800 font-semibold">
                      Submitting will update the reason for the full estate buyout.
                    </p>
                  )}
                </div>
              )}

              {tab2Preconditions?.activeBookingsCount && tab2Preconditions.activeBookingsCount > 0 ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{tab2Preconditions.activeBookingsCount} Existing Booking(s) on Date</span>
                  </div>
                  <p className="text-[10px] text-blue-800">
                    Blackout will stop NEW direct bookings. Existing confirmed guests ({tab2Preconditions.activeBookings.map(b => b.bookingNumber).join(", ")}) retain their stay.
                  </p>
                </div>
              ) : null}

              <div>
                <label className="block text-stone-700 font-bold mb-1">Reason / Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Buyout (Sharma-Verma)"
                  value={newBlackoutReason}
                  onChange={(e) => setNewBlackoutReason(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 focus:ring-2 focus:ring-[#384432] outline-none"
                />
              </div>

              {/* Quick suggestion pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "Full Estate Wedding Buyout",
                  "Corporate Leadership Retreat",
                  "Monsoon Deep Sanitization",
                  "Plumbing & HVAC Maintenance",
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setNewBlackoutReason(sug)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={Boolean(newBlackoutRoomTypeId && tab2Preconditions?.isResortWideBlocked)}
                className="w-full py-2.5 bg-[#384432] hover:bg-[#283224] text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {newBlackoutRoomTypeId && tab2Preconditions?.isResortWideBlocked
                  ? "Cannot Block (Already Resort-Wide)"
                  : tab2Preconditions?.isResortWideBlocked
                  ? "Update Resort-Wide Reason"
                  : "Schedule Blackout"}
              </button>
            </form>
          </div>

          {/* Active Blackouts List */}
          <div className="lg:col-span-2 bg-white border border-[#ebded2] rounded-2xl shadow-sm p-5 space-y-4">
            <h3 className="font-serif font-bold text-base text-stone-900 border-b border-stone-100 pb-3 flex items-center justify-between">
              <span>Scheduled Blackout Windows ({blackouts.length})</span>
              <span className="text-xs font-sans text-stone-500 font-normal">
                Direct booking closed on these dates
              </span>
            </h3>

            {blackouts.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                No active blackouts scheduled. Direct booking is open across all calendar dates.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {blackouts.map((b) => (
                  <div
                    key={b.id}
                    className="py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-stone-900 text-sm">{b.date}</strong>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.roomType
                              ? "bg-purple-100 text-purple-900 border border-purple-200"
                              : "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                          }`}
                        >
                          {b.roomType ? b.roomType.name : "Resort-Wide Buyout (All 76 Keys)"}
                        </span>
                      </div>
                      <p className="text-stone-600 mt-0.5">{b.reason}</p>
                    </div>

                    <button
                      onClick={() =>
                        setDeleteModal({
                          isOpen: true,
                          id: b.id,
                          date: b.date,
                          reason: b.reason,
                          scopeName: b.roomType ? b.roomType.name : "Resort-Wide Buyout",
                          submitting: false,
                        })
                      }
                      className="px-2.5 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition font-bold text-[11px] flex items-center gap-1 border border-transparent hover:border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* TAB 3: PROMO CODES & VOUCHERS                                          */}
      {/* ---------------------------------------------------------------------- */}
      {activeTab === "promos" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#ebded2] rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#faf7f2] border-b border-[#ebded2] text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Voucher Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min Tariff / Max Cap</th>
                  <th className="py-3.5 px-4">Validity Window</th>
                  <th className="py-3.5 px-4">Redemption Count</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {promos.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900 text-sm">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg">
                        {p.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-800">
                      {p.discountPercent}% OFF
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      Min: {p.minTariff ? formatCurrency(p.minTariff) : "None"} • 
                      Cap: {p.maxDiscount ? formatCurrency(p.maxDiscount) : "None"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-500">
                      {p.validFrom} to {p.validTo}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-stone-900">{p.currentUses}</span> / {p.maxUses}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {p.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleTogglePromo(p.id, p.isActive)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          p.isActive
                            ? "border border-red-200 text-red-600 hover:bg-red-50"
                            : "bg-emerald-700 hover:bg-emerald-800 text-white"
                        }`}
                      >
                        {p.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* CUSTOM LUXURY MODAL 1: SCHEDULE BLACKOUT (Replacing window.prompt)    */}
      {/* ---------------------------------------------------------------------- */}
      {blackoutModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 border border-[#ebded2]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">
                    Schedule Blackout Window
                  </h3>
                  <p className="text-xs text-stone-500">
                    Disable online direct booking for this date
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBlackoutModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope & Date Preview Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Stay Date</span>
                <strong className="text-stone-900 font-mono text-sm block mt-0.5">
                  {blackoutModal.date}
                </strong>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Applies To</span>
                <strong className="text-stone-900 text-xs block mt-0.5 truncate">
                  {blackoutModal.roomTypeName}
                </strong>
              </div>
            </div>

            {/* Real-World Conflict Notice in Modal */}
            {blackoutModal.isChecking && (
              <div className="text-xs text-stone-400 italic">Verifying availability and conflicts...</div>
            )}

            {blackoutModal.preconditions?.isResortWideBlocked && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Resort-Wide Blackout Already Active!</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This date ({blackoutModal.date}) is already blocked for the entire resort under <strong>"{blackoutModal.preconditions.resortWideReason}"</strong>. All 76 rooms are already closed for online booking.
                </p>
                {blackoutModal.roomTypeId && (
                  <p className="text-[11px] font-bold text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
                    ✕ Redundant: You cannot block "{blackoutModal.roomTypeName}" separately when all rooms are already closed.
                  </p>
                )}
              </div>
            )}

            {blackoutModal.preconditions?.activeBookingsCount && blackoutModal.preconditions.activeBookingsCount > 0 ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{blackoutModal.preconditions.activeBookingsCount} Active Reservation(s) on Date</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Notice: Booking <strong>{blackoutModal.preconditions.activeBookings.map(b => b.bookingNumber).join(", ")}</strong> is already confirmed on this date. Scheduling this blackout will stop all NEW online bookings.
                </p>
              </div>
            ) : null}

            {/* Reason Form */}
            <form onSubmit={handleConfirmBlackoutModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">
                  Reason for Blackout / Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Estate Wedding Buyout"
                  value={blackoutModal.reason}
                  onChange={(e) => setBlackoutModal((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full p-3 border border-stone-300 rounded-xl bg-stone-50 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#384432]"
                  autoFocus
                />
              </div>

              {/* Suggestion Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Full Estate Wedding Buyout",
                  "Leadership Offsite Buyout",
                  "Monsoon Deep Sanitization",
                  "Plumbing Maintenance",
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setBlackoutModal((prev) => ({ ...prev, reason: sug }))}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setBlackoutModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 border border-stone-200 rounded-xl text-stone-700 font-semibold hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(blackoutModal.submitting || (blackoutModal.roomTypeId && blackoutModal.preconditions?.isResortWideBlocked))}
                  className="px-6 py-2.5 bg-[#384432] hover:bg-[#283224] text-white rounded-xl font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {blackoutModal.submitting
                    ? "Saving..."
                    : blackoutModal.roomTypeId && blackoutModal.preconditions?.isResortWideBlocked
                    ? "Cannot Block (Already Resort-Wide)"
                    : "Confirm Blackout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* CUSTOM LUXURY MODAL 2: DELETE BLACKOUT (Replacing window.confirm)      */}
      {/* ---------------------------------------------------------------------- */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 border border-[#ebded2]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-800 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">
                    Remove Blackout Window
                  </h3>
                  <p className="text-xs text-stone-500">
                    Re-open online direct booking
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500 font-semibold">Date:</span>
                <strong className="text-stone-900 font-mono">{deleteModal.date}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-semibold">Scope:</span>
                <span className="text-stone-900 font-bold">{deleteModal.scopeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-semibold">Event:</span>
                <span className="text-stone-900 italic">"{deleteModal.reason}"</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to remove this blackout? Guests browsing the website will immediately be able to book rooms on <strong>{deleteModal.date}</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 border border-stone-200 rounded-xl text-stone-700 font-semibold hover:bg-stone-50 transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBlackout}
                disabled={deleteModal.submitting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-sm transition text-xs disabled:opacity-50"
              >
                {deleteModal.submitting ? "Removing..." : "Yes, Re-open Inventory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* BULK SEASONAL RATE MODAL                                              */}
      {/* ---------------------------------------------------------------------- */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-700" />
                <span>Bulk Seasonal Rate Surcharge</span>
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Bulk update the nightly rate across multiple consecutive dates (e.g. Christmas/New Year peak or holiday long weekend).
            </p>

            <form onSubmit={handleBulkSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Room Category</label>
                <select
                  value={bulkRoomTypeId}
                  onChange={(e) => setBulkRoomTypeId(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 font-semibold"
                >
                  {matrix.map((m) => (
                    <option key={m.roomType.id} value={m.roomType.id}>
                      {m.roomType.name} (Base: {formatCurrency(m.roomType.basePrice)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={bulkEndDate}
                    onChange={(e) => setBulkEndDate(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">New Price Per Night (INR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="50"
                  placeholder="e.g. 9500"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-mono text-sm text-stone-900 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-700 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="px-5 py-2 bg-[#384432] hover:bg-[#283224] text-white rounded-xl font-bold shadow-sm disabled:opacity-50"
                >
                  {bulkSubmitting ? "Applying..." : "Apply Surcharge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* NEW PROMO CODE MODAL                                                   */}
      {/* ---------------------------------------------------------------------- */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-700" />
                <span>Create New Promo Voucher</span>
              </h3>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Promo Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON15"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 font-mono font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Discount %</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Max Discount Cap (INR)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={promoMaxDiscount}
                    onChange={(e) => setPromoMaxDiscount(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Valid From</label>
                  <input
                    type="date"
                    required
                    value={promoValidFrom}
                    onChange={(e) => setPromoValidFrom(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Valid To</label>
                  <input
                    type="date"
                    required
                    value={promoValidTo}
                    onChange={(e) => setPromoValidTo(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-xl bg-stone-50 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-700 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold shadow-sm"
                >
                  Create Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Editable Sub-Components
// ---------------------------------------------------------------------------
function InlinePriceInput({
  initialValue,
  onSave,
}: {
  initialValue: number;
  onSave: (newVal: number) => void;
}) {
  const [val, setVal] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="font-mono font-bold text-stone-900 hover:text-emerald-700 hover:underline flex items-center gap-1"
        title="Click to edit nightly price"
      >
        <span>{formatCurrency(val)}</span>
        <span className="text-[10px] text-stone-400 font-normal">✎</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-20 p-1 border border-stone-300 rounded font-mono text-xs font-bold"
        autoFocus
      />
      <button
        onClick={() => {
          setIsEditing(false);
          if (val !== initialValue) onSave(val);
        }}
        className="p-1 bg-emerald-700 text-white rounded text-[10px]"
        title="Save"
      >
        ✓
      </button>
      <button
        onClick={() => {
          setVal(initialValue);
          setIsEditing(false);
        }}
        className="p-1 text-stone-400 hover:text-stone-600 rounded text-[10px]"
        title="Cancel"
      >
        ✕
      </button>
    </div>
  );
}

function InlineAllotmentInput({
  initialValue,
  minAllowed,
  onSave,
}: {
  initialValue: number;
  minAllowed: number;
  onSave: (newVal: number) => void;
}) {
  const [val, setVal] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="font-mono font-bold text-stone-900 hover:text-emerald-700 hover:underline flex items-center gap-1"
        title="Click to edit website allotment"
      >
        <span>{val} Keys</span>
        <span className="text-[10px] text-stone-400 font-normal">✎</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={minAllowed}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-16 p-1 border border-stone-300 rounded font-mono text-xs font-bold"
        autoFocus
      />
      <button
        onClick={() => {
          setIsEditing(false);
          if (val !== initialValue) onSave(val);
        }}
        className="p-1 bg-emerald-700 text-white rounded text-[10px]"
        title="Save"
      >
        ✓
      </button>
      <button
        onClick={() => {
          setVal(initialValue);
          setIsEditing(false);
        }}
        className="p-1 text-stone-400 hover:text-stone-600 rounded text-[10px]"
        title="Cancel"
      >
        ✕
      </button>
    </div>
  );
}
