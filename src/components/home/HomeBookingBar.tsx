"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users, ArrowRight, ShieldCheck, Tag, Sparkles } from "lucide-react";

export function HomeBookingBar() {
  const router = useRouter();

  // Compute sensible default dates: tomorrow to +2 days
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(tomorrow.getDate() + 2);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(formatDate(tomorrow));
  const [checkOut, setCheckOut] = useState(formatDate(dayAfter));
  const [guests, setGuests] = useState("2");
  const [category, setCategory] = useState("all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    if (category !== "all") params.set("category", category);

    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl border border-stone-200/80 -mt-10 sm:-mt-12 relative z-20 max-w-5xl mx-auto">
      {/* Top Banner inside bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-stone-100 text-xs">
        <div className="flex items-center gap-2 text-stone-700">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-stone-900">Direct Sanctuary Rates:</span>
          <span className="text-stone-600 hidden sm:inline">Guaranteed Best Rate • 0% OTA Markups • Instant Confirmation</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-700 font-medium">
          <Tag className="w-3.5 h-3.5" />
          <span>Use code <strong className="font-bold underline">COFFEE10</strong> for 10% direct saving</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Check-In Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#384432]" />
            <span>Check-In Date</span>
          </label>
          <input
            type="date"
            value={checkIn}
            min={formatDate(today)}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (e.target.value >= checkOut) {
                const nextDay = new Date(e.target.value);
                nextDay.setDate(nextDay.getDate() + 1);
                setCheckOut(formatDate(nextDay));
              }
            }}
            className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-stone-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#384432] bg-stone-50/50"
            required
          />
        </div>

        {/* Check-Out Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#384432]" />
            <span>Check-Out Date</span>
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-stone-300 text-stone-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#384432] bg-stone-50/50"
            required
          />
        </div>

        {/* Guests & Category */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#384432]" />
            <span>Guests & Category</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full px-2 py-2.5 rounded-lg border border-stone-300 text-stone-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#384432] bg-stone-50/50"
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 py-2.5 rounded-lg border border-stone-300 text-stone-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#384432] bg-stone-50/50"
            >
              <option value="all">All Suites</option>
              <option value="planters">Heritage</option>
              <option value="suite">Suite</option>
              <option value="villa">Pool Villa</option>
            </select>
          </div>
        </div>

        {/* Search CTA Button */}
        <div>
          <button
            type="submit"
            className="w-full h-[42px] bg-gradient-to-r from-[#2f392b] to-[#46573e] hover:from-[#242c20] hover:to-[#384632] text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 group"
          >
            <span>Check Availability</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
}
