"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Check,
  ShieldAlert,
  ArrowRight,
  Info,
  Coffee,
  CheckCircle2,
  Tag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Camera,
  Maximize2,
  X,
  Compass,
  Bed,
  Sparkles,
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
  description: string;
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

// Specs mapping for luxury details
const ROOM_SPECS: Record<string, { size: string; view: string; bed: string }> = {
  "planters-heritage-room": {
    size: "450 sq.ft.",
    view: "Arabica Coffee Plantation View",
    bed: "King Size Colonial Teak Bed",
  },
  "coffee-estate-luxury-suite": {
    size: "750 sq.ft.",
    view: "Mullayanagiri Panoramic Hills",
    bed: "King Bed + Private Living Lounge",
  },
  "misty-valley-pool-villa": {
    size: "1,200 sq.ft.",
    view: "Secluded Silver Oak Estate Canopy",
    bed: "Master King Suite + Butler Quarters",
  },
};

const PHOTO_CAPTIONS: Record<string, string[]> = {
  "planters-heritage-room": [
    "Teakwood Heritage Bedroom with Estate Decor",
    "Private Balcony overlooking Arabica Coffee Bushes",
    "Modern Colonial En-suite with Rain Shower",
  ],
  "coffee-estate-luxury-suite": [
    "Panoramic Hill View Luxury Master Bedroom",
    "Private Living Lounge with Fireplace & Coffee Bar",
    "Freestanding Soaking Bathtub with Scenic Window",
  ],
  "misty-valley-pool-villa": [
    "Private Temperature-Controlled Plunge Pool & Sun Deck",
    "Open-Skylight Master Bedroom Suite",
    "Secluded Wooden Sun Deck & Estate Canopy",
  ],
};

function RoomCard({ room, checkIn, checkOut, guests }: { room: RoomData; checkIn: string; checkOut: string; guests: number }) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  const photos = room.photos && room.photos.length > 0 ? room.photos : ["/images/rooms/heritage-1.jpg"];
  const captions = PHOTO_CAPTIONS[room.roomSlug] || [
    "Master Bedroom View",
    "Estate Balcony View",
    "En-suite Bathroom View",
  ];
  const specs = ROOM_SPECS[room.roomSlug] || {
    size: "500 sq.ft.",
    view: "Coffee Estate Forest View",
    bed: "King Bed",
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const hasBlackout = !room.isAvailable && room.blackoutReason;

  return (
    <div className="bg-white border border-[#ebded2] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col lg:flex-row group">
      {/* Photo Carousel (3 Photos) */}
      <div className="lg:w-2/5 relative h-72 lg:h-auto min-h-[300px] bg-stone-900 overflow-hidden select-none">
        <img
          src={photos[activePhotoIdx]}
          alt={`${room.roomTypeName} - view ${activePhotoIdx + 1}`}
          className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
        />

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-900/80 text-white backdrop-blur-sm">
              Max {room.maxGuests} Guests
            </span>
            {room.isAvailable ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-700/90 text-white backdrop-blur-sm flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                <span>{room.availableKeys} Keys Available Direct</span>
              </span>
            ) : hasBlackout ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-700/90 text-white backdrop-blur-sm">
                Private Buyout
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-800/90 text-white backdrop-blur-sm">
                Sold Out
              </span>
            )}
          </div>

          {/* View Gallery Button */}
          <button
            type="button"
            onClick={() => setShowGallery(true)}
            className="pointer-events-auto p-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-sm transition"
            title="Open Fullscreen Gallery"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Carousel Navigation Arrows (Previous / Next) */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition"
              title="Previous Photo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition"
              title="Next Photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Bottom Photo Caption & Dot Indicators */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white text-xs pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] max-w-[75%] truncate">
            {captions[activePhotoIdx] || `View ${activePhotoIdx + 1} of ${photos.length}`}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
            <Camera className="w-3 h-3 text-stone-300" />
            <span className="text-[10px] font-bold">
              {activePhotoIdx + 1}/{photos.length}
            </span>
            <div className="flex gap-1 ml-1">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    idx === activePhotoIdx ? "bg-white scale-125" : "bg-white/40"
                  }`}
                  title={`View photo ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Room Information & Rate Details */}
      <div className="p-6 lg:w-3/5 flex flex-col justify-between space-y-4">
        <div>
          {/* Header & GST Slab Pill */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-serif font-bold text-xl text-stone-900 leading-tight">
                {room.roomTypeName}
              </h3>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                <span>Chikkamagaluru Coffee Estate</span>
                <span>•</span>
                <span>{room.nights} {room.nights === 1 ? "Night" : "Nights"} Stay</span>
              </p>
            </div>

            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                room.pricing.gstRatePercent === 12
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {room.pricing.gstRatePercent}% GST Slab
            </span>
          </div>

          {/* Sensory Narrative Description */}
          <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
            {room.description}
          </p>

          {/* Key Specs Row */}
          <div className="mt-3.5 grid grid-cols-3 gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] text-stone-700">
            <div className="flex items-center gap-1.5 truncate">
              <Compass className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{specs.size}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Bed className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{specs.bed}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{specs.view}</span>
            </div>
          </div>

          {/* Amenities Chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
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

          {/* Blackout notice */}
          {hasBlackout && (
            <div className="mt-3.5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <strong>Dates Blocked:</strong> {room.blackoutReason}
              </div>
            </div>
          )}
        </div>

        {/* Pricing Breakdown & Action Button */}
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
              Base Tariff ({room.nights}N): ₹{room.pricing.baseTotal.toLocaleString("en-IN")}
              {" + "}
              <span className="text-stone-700 font-medium">
                GST (₹{room.pricing.gstAmount.toLocaleString("en-IN")})
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl font-serif font-bold text-stone-900">
                ₹{room.pricing.grandTotal.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-stone-400">Total inclusive of all taxes</span>
            </div>
            <div className="text-[10px] text-stone-400">
              Statutory breakdown: CGST {room.pricing.cgstPercent}% (₹{room.pricing.cgstAmount.toLocaleString("en-IN")}) + SGST {room.pricing.sgstPercent}% (₹{room.pricing.sgstAmount.toLocaleString("en-IN")})
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

      {/* Fullscreen Photo Gallery Lightbox Modal */}
      {showGallery && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex flex-col justify-between p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => setShowGallery(false)}
        >
          <div className="flex items-center justify-between text-white pb-4 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="font-serif font-bold text-lg">{room.roomTypeName} Gallery</h3>
              <p className="text-xs text-stone-400">3 views of the room and private estate grounds</p>
            </div>
            <button
              type="button"
              onClick={() => setShowGallery(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto py-6 max-w-6xl mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {photos.map((photo, idx) => (
              <div key={idx} className="bg-stone-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
                <div className="h-64 overflow-hidden">
                  <img src={photo} alt={captions[idx]} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                </div>
                <div className="p-4 bg-stone-900 text-white">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                    View 0{idx + 1}
                  </span>
                  <p className="text-xs font-semibold mt-1">{captions[idx]}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-stone-400" onClick={(e) => e.stopPropagation()}>
            Click anywhere outside or press Close to return to room list
          </div>
        </div>
      )}
    </div>
  );
}

export function RoomCatalog() {
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
            <span>Statutory Indian GST applied dynamically (12% ≤ ₹7,500, 18% &gt; ₹7,500)</span>
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
          rooms.map((room) => (
            <RoomCard
              key={room.roomTypeId}
              room={room}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
            />
          ))
        )}
      </div>
    </div>
  );
}
