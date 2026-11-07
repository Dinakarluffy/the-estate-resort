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

  // Add Blackout state
  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [newBlackoutRoomTypeId, setNewBlackoutRoomTypeId] = useState<string>("");
  const [newBlackoutReason, setNewBlackoutReason] = useState("");

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

  // Toggle Blackout from Calendar
  const handleToggleDayBlackout = async (
    roomTypeId: string,
    date: string,
    isBlackout: boolean,
    blackoutId?: string | null
  ) => {
    try {
      if (isBlackout && blackoutId) {
        // Remove blackout
        const res = await fetch(`/api/admin/blackout?id=${blackoutId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove blackout");
        showToast("success", `Blackout cleared for ${date}`);
      } else {
        // Add blackout
        const reason = window.prompt("Reason for blocking this date:", "Estate Private Event");
        if (!reason) return;
        const res = await fetch("/api/admin/blackout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomTypeId,
            date,
            reason,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to set blackout");
        showToast("success", `Blackout set for ${date}`);
      }
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
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

  // Add Blackout
  const handleAddBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackoutDate || !newBlackoutReason.trim()) {
      showToast("error", "Please provide a date and reason");
      return;
    }
    try {
      const res = await fetch("/api/admin/blackout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newBlackoutDate,
          roomTypeId: newBlackoutRoomTypeId || null,
          reason: newBlackoutReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add blackout");

      showToast("success", `Blackout scheduled for ${newBlackoutDate}`);
      setNewBlackoutDate("");
      setNewBlackoutReason("");
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    }
  };

  // Delete Blackout
  const handleDeleteBlackout = async (id: string, date: string) => {
    if (!confirm(`Remove blackout for ${date}? Direct booking will re-open for this date.`)) return;
    try {
      const res = await fetch(`/api/admin/blackout?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete blackout");
      showToast("success", `Blackout removed for ${date}`);
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

                          {/* Blackout Actions */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() =>
                                handleToggleDayBlackout(
                                  selectedMatrix.roomType.id,
                                  day.date,
                                  day.isBlackout,
                                  day.blackoutId
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

            <form onSubmit={handleAddBlackout} className="space-y-3 text-xs">
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
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 focus:ring-2 focus:ring-[#384432] outline-none"
                >
                  <option value="">Resort-Wide (All 76 Keys)</option>
                  {matrix.map((m) => (
                    <option key={m.roomType.id} value={m.roomType.id}>
                      {m.roomType.name} Only
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Reason / Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Buyout (Verma-Shah)"
                  value={newBlackoutReason}
                  onChange={(e) => setNewBlackoutReason(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-stone-50 text-stone-900 focus:ring-2 focus:ring-[#384432] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#384432] hover:bg-[#283224] text-white font-bold rounded-xl transition shadow-sm"
              >
                Schedule Blackout
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {b.roomType ? b.roomType.name : "Resort-Wide Buyout"}
                        </span>
                      </div>
                      <p className="text-stone-500 mt-0.5">{b.reason}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteBlackout(b.id, b.date)}
                      className="px-2.5 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition font-bold text-[11px] flex items-center gap-1"
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
