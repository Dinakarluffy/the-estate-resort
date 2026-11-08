"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  RefreshCw,
  ExternalLink,
  Calendar,
  AlertTriangle,
  X,
  LogIn,
  LogOut,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/gst";

interface BookingItem {
  id: string;
  bookingNumber: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  baseTariffTotal: number;
  discountAmount: number;
  netTaxableAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  grandTotal: number;
  status: string; // CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED
  paymentStatus: string;
  paymentReference: string;
  promoCode?: string | null;
  createdAt: string;
  roomType: {
    id: string;
    name: string;
    slug: string;
  };
}

export function StaffBookingsManager() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "TODAY_ARRIVALS" | "TODAY_DEPARTURES">("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Status Change Confirmation Modal State (Check In / Check Out)
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    booking: BookingItem | null;
    targetStatus: "CHECKED_IN" | "CHECKED_OUT";
    isEarly: boolean;
    daysDifference: number;
    submitting: boolean;
  }>({
    isOpen: false,
    booking: null,
    targetStatus: "CHECKED_IN",
    isEarly: false,
    daysDifference: 0,
    submitting: false,
  });

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff/bookings");
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "Failed to fetch bookings: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Initiate Check In with Early Arrival Detection
  const initiateCheckIn = (b: BookingItem) => {
    const isEarly = b.checkIn > todayStr;
    const diffTime = new Date(b.checkIn).getTime() - new Date(todayStr).getTime();
    const daysDiff = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    setStatusModal({
      isOpen: true,
      booking: b,
      targetStatus: "CHECKED_IN",
      isEarly,
      daysDifference: daysDiff,
      submitting: false,
    });
  };

  // Initiate Check Out
  const initiateCheckOut = (b: BookingItem) => {
    setStatusModal({
      isOpen: true,
      booking: b,
      targetStatus: "CHECKED_OUT",
      isEarly: false,
      daysDifference: 0,
      submitting: false,
    });
  };

  // Confirm and Execute Status Change (PATCH API)
  const handleConfirmStatusChange = async () => {
    if (!statusModal.booking) return;
    const b = statusModal.booking;
    const target = statusModal.targetStatus;
    setStatusModal((prev) => ({ ...prev, submitting: true }));

    try {
      const res = await fetch(`/api/staff/bookings/${b.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update booking status");

      showToast(
        "success",
        target === "CHECKED_IN"
          ? `Guest ${b.bookingNumber} (${b.guestName}) is now CHECKED-IN`
          : `Guest ${b.bookingNumber} (${b.guestName}) departure completed (CHECKED-OUT)`
      );
      setStatusModal({
        isOpen: false,
        booking: null,
        targetStatus: "CHECKED_IN",
        isEarly: false,
        daysDifference: 0,
        submitting: false,
      });
      fetchBookings();
    } catch (err: any) {
      showToast("error", err.message);
      setStatusModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  // 1-Click PMS CSV Download Trigger (Includes UTF-8 BOM)
  const handleDownloadCsv = () => {
    let url = "/api/staff/bookings/export";
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.append("status", statusFilter);
    if (searchTerm.trim()) params.append("search", searchTerm.trim());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    window.location.href = url;
  };

  // Filtered in-memory for instant feedback
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

    let matchesTime = true;
    if (timeFilter === "TODAY_ARRIVALS") {
      matchesTime = b.checkIn === todayStr;
    } else if (timeFilter === "TODAY_DEPARTURES") {
      matchesTime = b.checkOut === todayStr;
    }

    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.bookingNumber.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      b.guestEmail.toLowerCase().includes(q) ||
      b.guestPhone.toLowerCase().includes(q) ||
      b.roomType.name.toLowerCase().includes(q);

    return matchesStatus && matchesTime && matchesSearch;
  });

  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const checkedInCount = bookings.filter((b) => b.status === "CHECKED_IN").length;
  const checkedOutCount = bookings.filter((b) => b.status === "CHECKED_OUT").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;

  const todayArrivalsCount = bookings.filter((b) => b.checkIn === todayStr).length;
  const todayDeparturesCount = bookings.filter((b) => b.checkOut === todayStr).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm transition-all animate-in fade-in slide-in-from-top-2 print:hidden ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
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

      {/* Printable Header (Visible Only on Physical Printout) */}
      <div className="hidden print:block pb-4 mb-4 border-b border-stone-300">
        <h1 className="text-xl font-bold font-serif text-stone-900">
          The Estate Chikkamagaluru — Front Desk Guest Manifest
        </h1>
        <p className="text-xs text-stone-600">
          Generated on {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} • Official Hotel Operations Roster
        </p>
      </div>

      {/* KPI Cards Row (5 Distinct Status Pillars) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 print:hidden">
        <div className="bg-white border border-[#ebded2] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Total Bookings
          </span>
          <div className="text-2xl font-serif font-bold text-stone-900 mt-1">
            {totalCount}
          </div>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Online Direct Sales</span>
        </div>

        <div className="bg-white border border-[#ebded2] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Confirmed Active
          </span>
          <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">
            {confirmedCount}
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Guaranteed Keys</span>
        </div>

        <div className="bg-white border border-[#ebded2] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
            In-House (Staying)
          </span>
          <div className="text-2xl font-serif font-bold text-blue-800 mt-1">
            {checkedInCount}
          </div>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Keys Occupied</span>
        </div>

        <div className="bg-white border border-[#ebded2] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
            Departed
          </span>
          <div className="text-2xl font-serif font-bold text-purple-800 mt-1">
            {checkedOutCount}
          </div>
          <span className="text-[10px] text-purple-600 mt-0.5 block">Checked Out</span>
        </div>

        <div className="bg-white border border-[#ebded2] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
            Cancelled
          </span>
          <div className="text-2xl font-serif font-bold text-red-700 mt-1">
            {cancelledCount}
          </div>
          <span className="text-[10px] text-red-500 mt-0.5 block">Inventory Released</span>
        </div>
      </div>

      {/* Operational Filter & Action Toolbar */}
      <div className="bg-white border border-[#ebded2] p-4 rounded-2xl shadow-sm space-y-3 print:hidden">
        {/* Top Controls: Search + PMS Export + Print Roster */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Guest Name, Phone, Email, Reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#384432]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="p-2 text-stone-500 hover:text-stone-800 bg-stone-50 border border-stone-200 rounded-xl transition"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-stone-200 shadow-2xs whitespace-nowrap"
              title="Print Morning Arrival Manifest"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>Print Manifest</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export to PMS (CSV)</span>
            </button>
          </div>
        </div>

        {/* Dual Filter Ribbon: Quick Date Filters & Reservation Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
          {/* Quick Date Horizon Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>Horizon:</span>
            </span>
            <button
              onClick={() => setTimeFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                timeFilter === "ALL"
                  ? "bg-[#384432] text-white shadow-2xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => setTimeFilter("TODAY_ARRIVALS")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                timeFilter === "TODAY_ARRIVALS"
                  ? "bg-emerald-800 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <span>Today's Arrivals</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                {todayArrivalsCount}
              </span>
            </button>
            <button
              onClick={() => setTimeFilter("TODAY_DEPARTURES")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                timeFilter === "TODAY_DEPARTURES"
                  ? "bg-purple-800 text-white shadow-2xs"
                  : "bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100"
              }`}
            >
              <span>Today's Departures</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                {todayDeparturesCount}
              </span>
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["ALL", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-stone-800 text-white shadow-2xs"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {st === "ALL" ? "All Status" : st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings Roster Table */}
      <div className="bg-white border border-[#ebded2] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#faf7f2] border-b border-[#ebded2] text-stone-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Primary Guest</th>
                <th className="py-3.5 px-4">Room Category</th>
                <th className="py-3.5 px-4">Stay Schedule</th>
                <th className="py-3.5 px-4">Total Tariff & Payment</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right print:hidden">Front Desk Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No reservations match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/80 transition">
                    {/* Booking Reference */}
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/confirmation/${b.bookingNumber}`}
                          target="_blank"
                          className="hover:underline hover:text-emerald-800"
                        >
                          {b.bookingNumber}
                        </Link>
                        <ExternalLink className="w-3 h-3 text-stone-400 print:hidden" />
                      </div>
                      <span className="text-[10px] font-normal text-stone-400 font-sans block">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Guest Name & Contact */}
                    <td className="py-3 px-4">
                      <strong className="text-stone-900 block">{b.guestName}</strong>
                      <span className="text-[11px] text-stone-500 font-mono block">
                        {b.guestPhone}
                      </span>
                      <span className="text-[10px] text-stone-400 block truncate max-w-[160px]">
                        {b.guestEmail}
                      </span>
                    </td>

                    {/* Room Category */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-800 block">
                        {b.roomType.name}
                      </span>
                      {b.promoCode && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {b.promoCode} applied
                        </span>
                      )}
                    </td>

                    {/* Stay Schedule */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-stone-900">
                        {b.checkIn} → {b.checkOut}
                      </div>
                      <span className="text-[10px] text-stone-500 block">
                        {b.totalNights} {b.totalNights === 1 ? "Night" : "Nights"}
                      </span>
                    </td>

                    {/* Price & Payment Status Badge */}
                    <td className="py-3 px-4">
                      <strong className="text-stone-900 block font-mono text-sm">
                        {formatCurrency(b.grandTotal)}
                      </strong>
                      <span className="text-[10px] text-stone-500 block font-mono">
                        Incl. {b.gstRatePercent}% GST ({formatCurrency(b.gstAmount)})
                      </span>
                      <div className="mt-1">
                        {b.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Paid Online (Razorpay)
                          </span>
                        ) : b.paymentStatus === "REFUNDED" ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            Refunded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                            {b.paymentStatus}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : b.status === "CHECKED_IN"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : b.status === "CHECKED_OUT"
                            ? "bg-purple-100 text-purple-800 border border-purple-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Front Desk Operational Actions */}
                    <td className="py-3 px-4 text-right space-x-2 print:hidden">
                      {/* Check In Action */}
                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => initiateCheckIn(b)}
                          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold transition shadow-2xs inline-flex items-center gap-1"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Check In</span>
                        </button>
                      )}

                      {/* Check Out Action */}
                      {b.status === "CHECKED_IN" && (
                        <button
                          onClick={() => initiateCheckOut(b)}
                          className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[11px] font-bold transition shadow-2xs inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Check Out</span>
                        </button>
                      )}

                      <Link
                        href={`/confirmation/${b.bookingNumber}`}
                        target="_blank"
                        className="px-2 py-1 border border-stone-200 text-stone-600 hover:bg-stone-100 rounded-lg text-[11px] font-semibold transition inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3 text-stone-400" />
                        <span>Tax Invoice</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* CUSTOM LUXURY MODAL: CHECK-IN / CHECK-OUT OPERATIONAL LIFECYCLE        */}
      {/* ---------------------------------------------------------------------- */}
      {statusModal.isOpen && statusModal.booking && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 border border-[#ebded2]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    statusModal.targetStatus === "CHECKED_IN"
                      ? statusModal.isEarly
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {statusModal.targetStatus === "CHECKED_IN" ? (
                    statusModal.isEarly ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <LogIn className="w-5 h-5" />
                    )
                  ) : (
                    <LogOut className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">
                    {statusModal.targetStatus === "CHECKED_IN"
                      ? statusModal.isEarly
                        ? "Early Check-In Confirmation"
                        : "Confirm Guest Check-In"
                      : "Confirm Guest Departure (Check-Out)"}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Front desk operational stay management
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setStatusModal({
                    isOpen: false,
                    booking: null,
                    targetStatus: "CHECKED_IN",
                    isEarly: false,
                    daysDifference: 0,
                    submitting: false,
                  })
                }
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guest Summary Card */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500 font-semibold">Guest Name:</span>
                <strong className="text-stone-900 font-bold">{statusModal.booking.guestName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-semibold">Booking Ref:</span>
                <span className="text-stone-900 font-mono font-bold">{statusModal.booking.bookingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-semibold">Room Category:</span>
                <span className="text-stone-900 font-semibold">{statusModal.booking.roomType.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-semibold">Scheduled Stay:</span>
                <span className="text-stone-900 font-mono">
                  {statusModal.booking.checkIn} to {statusModal.booking.checkOut} ({statusModal.booking.totalNights}N)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-semibold">Payment Received:</span>
                <strong className="text-emerald-800 font-mono">
                  {formatCurrency(statusModal.booking.grandTotal)} (Paid)
                </strong>
              </div>
            </div>

            {/* Contextual Warning / Guidance */}
            {statusModal.targetStatus === "CHECKED_IN" && statusModal.isEarly && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Early Arrival Warning</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  This reservation is scheduled for check-in on <strong>{statusModal.booking.checkIn}</strong> (in {statusModal.daysDifference} days).
                  Confirm that the guest is physically present at the reception desk and the room has been cleaned and inspected by housekeeping.
                </p>
              </div>
            )}

            {statusModal.targetStatus === "CHECKED_IN" && !statusModal.isEarly && (
              <p className="text-xs text-stone-600 leading-relaxed">
                Guest arrival verified. Confirming will mark the reservation as <strong>CHECKED IN</strong> and assign room keys.
              </p>
            )}

            {statusModal.targetStatus === "CHECKED_OUT" && (
              <p className="text-xs text-stone-600 leading-relaxed">
                Confirming departure will release the key card and mark the room as vacated. Housekeeping will be notified to begin turnover cleaning.
              </p>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() =>
                  setStatusModal({
                    isOpen: false,
                    booking: null,
                    targetStatus: "CHECKED_IN",
                    isEarly: false,
                    daysDifference: 0,
                    submitting: false,
                  })
                }
                className="px-4 py-2.5 border border-stone-200 rounded-xl text-stone-700 font-semibold hover:bg-stone-50 transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={statusModal.submitting}
                className={`px-5 py-2.5 text-white rounded-xl font-bold shadow-sm transition text-xs disabled:opacity-50 ${
                  statusModal.targetStatus === "CHECKED_IN"
                    ? statusModal.isEarly
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-blue-700 hover:bg-blue-800"
                    : "bg-purple-700 hover:bg-purple-800"
                }`}
              >
                {statusModal.submitting
                  ? "Updating..."
                  : statusModal.targetStatus === "CHECKED_IN"
                  ? statusModal.isEarly
                    ? "Yes, Confirm Early Check-In"
                    : "Confirm Check-In & Issue Key"
                  : "Complete Check-Out (Guest Departed)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
