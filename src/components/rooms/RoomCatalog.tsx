"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Check,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  Coffee,
  CheckCircle2,
  Tag,
  Loader2,
} from "lucide-react";

interface DailyRate {
  date: string;
  price: number;
  websiteAllotment: number;
  bookedCount: number;
  availableKeys: number;
  isBlackedOut: boolean;
}

interface GSTPricing {
  ratePerNight: number;
  nights: number;
  baseTotal: number;
  discountAmount: number;
  netTaxableAmount: number;
  gstRatePercent: 12 | 18;
  cgstPercent: 6 | 9;
  sgstPercent: 6 | 9;
  cgstAmount: number;
  sgstAmount: number;
  gstAmount: number;
  grandTotal: number;
}

interface RoomData {
  roomTypeId: string;
  roomTypeName: string;
  roomSlug: string;
  maxGuests: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  isAvailable: boolean;
  availableKeys: number;
  dailyRates: DailyRate[];
  pricing: GSTPricing;
  blackoutReason?: string;
  photos: string[];
  amenities: string[];
}

export function RoomCatalog() {
  // Default to tomorrow and day after tomorrow
  const getDefaultDates = () => {
    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(today.getDate() + 1);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 3);

    return {
      checkIn: d1.toISOString().split("T")[0],
      checkOut: d2.toISOString().split("T")[0],
    };
  };

  const initialDates = getDefaultDates();
  const [checkIn, setCheckIn] = useState(initialDates.checkIn);
  const [checkOut, setCheckOut] = useState(initialDates.checkOut);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async (cin: string, cout: string, gCount: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/availability?checkIn=${cin}&checkOut=${cout}&guests=${gCount}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to load live room rates");
      } else {
        setRooms(data.data);
      }
    } catch {
      setError("Unable to connect to availability service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability(checkIn, checkOut, guests);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkIn >= checkOut) {
      setError("Check-out date must be strictly after check-in date.");
      return;
    }
    fetchAvailability(checkIn, checkOut, guests);
  };

  return (
    <div className="space-y-8">
      {/* Date & Guests Search Bar */}
      <div className="bg-white border border-[#ebded2] rounded-2xl p-4 md:p-6 shadow-sm">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Check-in Date</span>
            </label>
            <input
              type="date"
              value={checkIn}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>Check-out Date</span>
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-stone-400" />
              <span>Guests</span>
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
            >
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4 Guests</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#384432] hover:bg-[#2c3627] text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>Check Availability</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Direct Booking Promo Callout */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>Direct Booking Advantage:</strong> Use coupon code <strong className="font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">COFFEE10</strong> at checkout for 10% instant discount!
            </span>
          </div>

          <div className="text-[11px] text-stone-500 flex items-center gap-1">
            <Info className="w-3 h-3 text-stone-400" />
            <span>Statutory Indian GST applied dynamically (12% $\le$ ₹7.5k, 18% &gt; ₹7.5k)</span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Rooms List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#384432] mx-auto" />
            <p className="text-xs text-stone-500 font-medium">
              Checking real-time allotment and calculating GST across 76 resort keys...
            </p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white border border-[#ebded2] rounded-2xl p-12 text-center space-y-3">
            <Coffee className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="font-serif font-bold text-base text-stone-900">
              No Rooms Available For Selected Criteria
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Please adjust your stay dates or guest count to view available rooms and villas at The Estate.
            </p>
          </div>
        ) : (
          rooms.map((room) => {
            const hasBlackout = !room.isAvailable && room.blackoutReason;
            const isSoldOut = !room.isAvailable && !room.blackoutReason;
            const primaryPhoto = room.photos[0] || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80";

            return (
              <div
                key={room.roomTypeId}
                className="bg-white border border-[#ebded2] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col lg:flex-row"
              >
                {/* Photo Gallery / Thumbnail */}
                <div className="lg:w-2/5 relative h-64 lg:h-auto min-h-[260px] bg-stone-100 overflow-hidden">
                  <img
                    src={primaryPhoto}
                    alt={room.roomTypeName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-900/75 text-white backdrop-blur-sm">
                      Max {room.maxGuests} Guests
                    </span>
                    {room.isAvailable ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600/90 text-white backdrop-blur-sm flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{room.availableKeys} Keys Available Direct</span>
                      </span>
                    ) : hasBlackout ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-600/90 text-white backdrop-blur-sm">
                        Private Buyout
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-700/90 text-white backdrop-blur-sm">
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>

                {/* Room Info & Details */}
                <div className="p-6 lg:w-3/5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif font-bold text-xl text-stone-900">
                          {room.roomTypeName}
                        </h3>
                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                          <span>Chikkamagaluru Coffee Estate</span>
                          <span>•</span>
                          <span>{room.nights} {room.nights === 1 ? "Night" : "Nights"} Stay</span>
                        </p>
                      </div>

                      {/* GST Slab Pill */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          room.pricing.gstRatePercent === 12
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {room.pricing.gstRatePercent}% GST Slab
                      </span>
                    </div>

                    {/* Amenities chips */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {room.amenities.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[11px] flex items-center gap-1 font-medium"
                        >
                          <Check className="w-2.5 h-2.5 text-stone-500" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>

                    {/* Blackout warning if any */}
                    {hasBlackout && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                        <div>
                          <strong>Dates Unavailable:</strong> {room.blackoutReason}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing Breakdown & Booking Button */}
                  <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-stone-500">
                        Avg. Nightly Rate:{" "}
                        <span className="font-semibold text-stone-800">
                          ₹{room.pricing.ratePerNight.toLocaleString("en-IN")}
                        </span>{" "}
                        / night
                      </div>

                      <div className="text-xs text-stone-500">
                        Base Total ({room.nights}N): ₹{room.pricing.baseTotal.toLocaleString("en-IN")}
                        {" + "}
                        <span className="text-stone-700 font-medium">
                          GST (₹{room.pricing.gstAmount.toLocaleString("en-IN")})
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-2xl font-serif font-bold text-stone-900">
                          ₹{room.pricing.grandTotal.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] text-stone-400">Total inclusive of taxes</span>
                      </div>
                      <div className="text-[10px] text-stone-400">
                        Includes CGST ({room.pricing.cgstPercent}%: ₹{room.pricing.cgstAmount.toLocaleString("en-IN")}) + SGST ({room.pricing.sgstPercent}%: ₹{room.pricing.sgstAmount.toLocaleString("en-IN")})
                      </div>
                    </div>

                    <div>
                      {room.isAvailable ? (
                        <Link
                          href={`/book?roomTypeId=${room.roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#384432] hover:bg-[#283224] text-white rounded-xl text-xs font-bold transition shadow hover:shadow-md"
                        >
                          <span>Book Direct Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="px-5 py-2.5 bg-stone-200 text-stone-500 rounded-xl text-xs font-semibold cursor-not-allowed"
                        >
                          {hasBlackout ? "Unavailable (Blackout)" : "Sold Out"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
