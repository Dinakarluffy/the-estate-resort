"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  UserCheck,
  Filter,
  RefreshCw,
  ExternalLink,
  Calendar,
  IndianRupee,
  ShieldCheck,
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
  status: string; // CONFIRMED | CHECKED_IN | CANCELLED
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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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

  // Operational Action: Mark guest as checked in
  const handleMarkCheckedIn = async (bookingId: string, bookingNumber: string) => {
    setActionLoadingId(bookingId);
    try {
      const res = await fetch(`/api/staff/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CHECKED_IN" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update check-in status");

      showToast("success", `Guest ${bookingNumber} marked as CHECKED-IN`);
      fetchBookings();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click PMS CSV Download Trigger
  const handleDownloadCsv = () => {
    let url = "/api/staff/bookings/export";
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.append("status", statusFilter);
    if (searchTerm.trim()) params.append("search", searchTerm.trim());

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Trigger browser native download
    window.location.href = url;
  };

  // Filtered in-memory for instant feedback
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      b.bookingNumber.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      b.guestEmail.toLowerCase().includes(q) ||
      b.guestPhone.toLowerCase().includes(q) ||
      b.roomType.name.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const checkedInCount = bookings.filter((b) => b.status === "CHECKED_IN").length;
  const cancelledCount = bookings.filter((b) => b.status === "CANCELLED").length;

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

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#ebded2] p-4 rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Total Reservations
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
            In-House (Checked-In)
          </span>
          <div className="text-2xl font-serif font-bold text-blue-800 mt-1">
            {checkedInCount}
          </div>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Currently Staying</span>
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

      {/* Action Bar: Search, Status Filter & 1-Click PMS Export */}
      <div className="bg-white border border-[#ebded2] p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
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

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(["ALL", "CONFIRMED", "CHECKED_IN", "CANCELLED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-[#384432] text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {st === "ALL" ? "All Bookings" : st.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* PMS Export Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="p-2 text-stone-500 hover:text-stone-800 bg-stone-50 border border-stone-200 rounded-xl transition"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export to PMS (CSV)</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-[#ebded2] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#faf7f2] border-b border-[#ebded2] text-stone-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Booking Ref</th>
                <th className="py-3.5 px-4">Primary Guest</th>
                <th className="py-3.5 px-4">Room Category</th>
                <th className="py-3.5 px-4">Stay Schedule</th>
                <th className="py-3.5 px-4">Total Tariff (INR)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No reservations match the search criteria.
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
                        <ExternalLink className="w-3 h-3 text-stone-400" />
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

                    {/* Price & GST */}
                    <td className="py-3 px-4">
                      <strong className="text-stone-900 block font-mono">
                        {formatCurrency(b.grandTotal)}
                      </strong>
                      <span className="text-[10px] text-stone-500 block font-mono">
                        Incl. {b.gstRatePercent}% GST ({formatCurrency(b.gstAmount)})
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : b.status === "CHECKED_IN"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-red-100 text-red-800 border border-red-300"
                        }`}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-2">
                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleMarkCheckedIn(b.id, b.bookingNumber)}
                          disabled={actionLoadingId === b.id}
                          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold transition shadow-xs disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>{actionLoadingId === b.id ? "Checking In..." : "Check In"}</span>
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
    </div>
  );
}
