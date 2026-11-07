"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Tag,
  CreditCard,
  Lock,
  ArrowRight,
  ArrowLeft,
  Coffee,
  Loader2,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface RoomTypeData {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  maxGuests: number;
  photos: string[];
  amenities: string[];
}

interface BookingWizardProps {
  user: UserProfile;
}

export function BookingWizard({ user }: BookingWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomTypeIdParam = searchParams.get("roomTypeId");
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const guestsParam = searchParams.get("guests");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [room, setRoom] = useState<RoomTypeData | null>(null);

  // Step 1: Stay Details
  const [checkIn, setCheckIn] = useState(checkInParam || "");
  const [checkOut, setCheckOut] = useState(checkOutParam || "");
  const [guests, setGuests] = useState(guestsParam ? parseInt(guestsParam, 10) : 2);

  // Step 2: Guest Details (DPDP Act)
  const [guestName, setGuestName] = useState(user.name || "");
  const [guestEmail, setGuestEmail] = useState(user.email || "");
  const [guestPhone, setGuestPhone] = useState("+91 98765 43210");
  const [specialRequests, setSpecialRequests] = useState("");

  // Step 3: Promo & Payment
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "UPI">("CARD");
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [upiId, setUpiId] = useState("guest@okhdfcbank");

  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Fetch Room Info
  useEffect(() => {
    async function fetchRoom() {
      if (!roomTypeIdParam) return;
      try {
        const cin = checkIn || new Date().toISOString().split("T")[0];
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 2);
        const cout = checkOut || nextDay.toISOString().split("T")[0];

        const res = await fetch(`/api/availability?checkIn=${cin}&checkOut=${cout}&roomTypeId=${roomTypeIdParam}`);
        const data = await res.json();
        if (data.success && data.data) {
          setRoom({
            id: data.data.roomTypeId,
            name: data.data.roomTypeName,
            slug: data.data.roomSlug,
            basePrice: data.data.pricing.ratePerNight,
            maxGuests: data.data.maxGuests,
            photos: data.data.photos || ["/images/rooms/heritage-1.jpg"],
            amenities: data.data.amenities || [],
          });
        }
      } catch (e) {
        console.error("Failed to load room details", e);
      } finally {
        setLoadingRoom(false);
      }
    }
    fetchRoom();
  }, [roomTypeIdParam]);

  // Compute Nights
  const computeNights = () => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = computeNights();
  const ratePerNight = room?.basePrice || 6500;
  const baseTariffTotal = ratePerNight * nights;

  // Statutory Indian GST Slabs: <= ₹7,500/night -> 12%; > ₹7,500/night -> 18%
  const gstRatePercent = ratePerNight <= 7500 ? 12 : 18;
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const netTaxableAmount = Math.max(0, baseTariffTotal - discountAmount);
  const gstAmount = Math.round(((netTaxableAmount * gstRatePercent) / 100) * 100) / 100;
  const grandTotal = Math.round((netTaxableAmount + gstAmount) * 100) / 100;

  // Handle Promo Code Validation
  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setValidatingPromo(true);
    setPromoError(null);

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          baseTariffTotal,
          checkInDate: checkIn,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPromoError(data.error || "Invalid promo code");
        setAppliedPromo(null);
      } else {
        setAppliedPromo({
          code: data.promo.code,
          discountAmount: data.promo.discountAmount,
        });
        setPromoError(null);
      }
    } catch {
      setPromoError("Failed to validate promo code. Please try again.");
    } finally {
      setValidatingPromo(false);
    }
  };

  // Handle Booking & Payment Submission
  const handleCompleteBooking = async () => {
    if (!room) return;
    setProcessingPayment(true);
    setBookingError(null);

    try {
      // 1. Simulate Payment Gateway
      const payRes = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal,
          paymentMethod,
          cardNumber: paymentMethod === "CARD" ? cardNumber : undefined,
          cardExpiry: paymentMethod === "CARD" ? cardExpiry : undefined,
          cardCvv: paymentMethod === "CARD" ? cardCvv : undefined,
          upiId: paymentMethod === "UPI" ? upiId : undefined,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok || !payData.success) {
        setBookingError(payData.error || "Payment was declined by payment gateway");
        setProcessingPayment(false);
        return;
      }

      // 2. Create Confirmed Booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomTypeId: room.id,
          checkIn,
          checkOut,
          guestName,
          guestEmail,
          guestPhone,
          promoCode: appliedPromo?.code,
          paymentReference: payData.data.paymentReference,
        }),
      });

      const bookingData = await bookingRes.json();
      if (!bookingRes.ok || !bookingData.success) {
        setBookingError(bookingData.error || "Failed to confirm reservation");
        setProcessingPayment(false);
        return;
      }

      // 3. Success -> Redirect to Confirmation Receipt
      router.push(`/confirmation/${bookingData.booking.bookingNumber}`);
    } catch (err: any) {
      setBookingError(err.message || "An unexpected error occurred during checkout");
      setProcessingPayment(false);
    }
  };

  if (loadingRoom) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#384432] mx-auto" />
        <p className="text-xs text-stone-500 font-medium">Securing live website allotment and preparing checkout...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-white border border-[#ebded2] rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
        <h3 className="text-lg font-serif font-bold text-stone-900">Room Not Selected</h3>
        <p className="text-xs text-stone-500">
          Please select a room type from our collection before proceeding to direct checkout.
        </p>
        <Link
          href="/rooms"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#384432] text-white rounded-lg text-xs font-bold transition shadow"
        >
          <span>Browse Available Rooms</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 3-Step Progress Header */}
      <div className="bg-white border border-[#ebded2] rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step >= 1 ? "bg-[#384432] text-white shadow-sm" : "bg-stone-100 text-stone-400"
              }`}
            >
              1
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Step 1</span>
              <span className={`text-xs font-semibold ${step >= 1 ? "text-stone-900" : "text-stone-400"}`}>
                Stay & Room
              </span>
            </div>
          </div>

          <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? "bg-[#384432]" : "bg-stone-200"}`} />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step >= 2 ? "bg-[#384432] text-white shadow-sm" : "bg-stone-100 text-stone-400"
              }`}
            >
              2
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Step 2</span>
              <span className={`text-xs font-semibold ${step >= 2 ? "text-stone-900" : "text-stone-400"}`}>
                Guest Details
              </span>
            </div>
          </div>

          <div className={`h-0.5 flex-1 mx-3 ${step >= 3 ? "bg-[#384432]" : "bg-stone-200"}`} />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step >= 3 ? "bg-[#384432] text-white shadow-sm" : "bg-stone-100 text-stone-400"
              }`}
            >
              3
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Step 3</span>
              <span className={`text-xs font-semibold ${step >= 3 ? "text-stone-900" : "text-stone-400"}`}>
                Payment & Promo
              </span>
            </div>
          </div>
        </div>
      </div>

      {bookingError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{bookingError}</span>
        </div>
      )}

      {/* STEP 1: Stay & Room Review */}
      {step === 1 && (
        <div className="bg-white border border-[#ebded2] rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-900">Review Your Selected Stay</h2>
              <p className="text-xs text-stone-500 mt-0.5">Step 1 of 3: Confirm dates and guest party</p>
            </div>
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                gstRatePercent === 12
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {gstRatePercent}% GST Slab
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-1/3 h-48 rounded-xl overflow-hidden shadow-sm bg-stone-100 shrink-0">
              <img src={room.photos[0]} alt={room.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-3 w-full">
              <h3 className="font-serif font-bold text-lg text-stone-900">{room.name}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Direct booking reservation at The Estate Chikkamagaluru. Zero OTA commission, free cancellation up to 48 hours before check-in.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">Check-in</span>
                  <strong className="text-stone-900 text-xs">{checkIn}</strong>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">Check-out</span>
                  <strong className="text-stone-900 text-xs">{checkOut}</strong>
                </div>
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase block">Stay Duration</span>
                  <strong className="text-stone-900 text-xs">{nights} {nights === 1 ? "Night" : "Nights"}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <Link
              href="/rooms"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Room</span>
            </Link>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 bg-[#384432] hover:bg-[#2c3627] text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-2"
            >
              <span>Continue to Guest Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Guest Details (DPDP Act 2023) */}
      {step === 2 && (
        <div className="bg-white border border-[#ebded2] rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-900">Guest Information</h2>
              <p className="text-xs text-stone-500 mt-0.5">Step 2 of 3: Primary guest contact for booking confirmation</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDP Act Compliant</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="e.g. priya@example.com"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Phone *</label>
              <input
                type="tel"
                required
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Special Requests (Optional)</label>
              <input
                type="text"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. Quiet room, late check-in around 6 PM"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#384432]"
              />
            </div>
          </div>

          {/* DPDP Act 2023 Statutory Privacy Notice */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900">Digital Personal Data Protection (DPDP) Act 2023:</strong>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                We only collect minimal PII necessary to execute your hotel stay. In compliance with Indian hospitality privacy regulations, no passport scans or identity documents are collected or stored on this website.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Stay Review</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 bg-[#384432] hover:bg-[#2c3627] text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-2"
            >
              <span>Continue to Payment & Promo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Promo & Mock Payment */}
      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-150">
          {/* Left Column: Payment & Promo Selection */}
          <div className="md:col-span-2 bg-white border border-[#ebded2] rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-900">Direct Payment & Coupon</h2>
              <p className="text-xs text-stone-500 mt-0.5">Step 3 of 3: Razorpay test-mode simulation</p>
            </div>

            {/* Promo Code Input */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Tag className="w-4 h-4 text-emerald-700" />
                <span>Direct Booking Promo Code</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Tip: Enter code <strong className="font-mono bg-emerald-100 px-1 py-0.5 rounded">COFFEE10</strong> for an instant 10% direct booking discount!
              </p>

              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code (e.g. COFFEE10)"
                  className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  disabled={validatingPromo || !promoCode.trim()}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {validatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply Code"}
                </button>
              </form>

              {appliedPromo && (
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Coupon {appliedPromo.code} applied! Saved ₹{appliedPromo.discountAmount.toLocaleString("en-IN")}.</span>
                </div>
              )}

              {promoError && (
                <div className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{promoError}</span>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-stone-700">Select Test Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    paymentMethod === "CARD"
                      ? "border-[#384432] bg-[#384432]/5 text-[#384432] ring-2 ring-[#384432]/20"
                      : "border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Test Credit/Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                    paymentMethod === "UPI"
                      ? "border-[#384432] bg-[#384432]/5 text-[#384432] ring-2 ring-[#384432]/20"
                      : "border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Instant UPI Test Simulation</span>
                </button>
              </div>

              {/* Card Inputs */}
              {paymentMethod === "CARD" && (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Test Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#384432]"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">Pre-filled with Razorpay test card</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#384432]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#384432]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Inputs */}
              {paymentMethod === "UPI" && (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                  <label className="block text-[11px] font-semibold text-stone-600">Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#384432]"
                  />
                  <span className="text-[10px] text-stone-400 block">Instant test approval mode active</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Guest Details</span>
              </button>

              <button
                type="button"
                disabled={processingPayment}
                onClick={handleCompleteBooking}
                className="px-6 py-2.5 bg-[#384432] hover:bg-[#2c3627] text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-2 disabled:opacity-50"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{grandTotal.toLocaleString("en-IN")} & Confirm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Statutory GST Tax Invoice Summary */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4 h-fit">
            <h3 className="font-serif font-bold text-base text-stone-900 border-b border-stone-200 pb-2">
              Price & GST Invoice
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>{room.name}</span>
                <span>₹{ratePerNight.toLocaleString("en-IN")}/N</span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>Base Tariff ({nights} Nights)</span>
                <span>₹{baseTariffTotal.toLocaleString("en-IN")}</span>
              </div>

              {appliedPromo && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Direct Promo ({appliedPromo.code})</span>
                  <span>-₹{appliedPromo.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between font-semibold text-stone-900 border-t border-stone-200 pt-2">
                <span>Net Taxable Accommodation</span>
                <span>₹{netTaxableAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-stone-500 text-[11px] pt-1">
                <span>CGST ({gstRatePercent / 2}%)</span>
                <span>₹{(gstAmount / 2).toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-stone-500 text-[11px]">
                <span>SGST ({gstRatePercent / 2}%)</span>
                <span>₹{(gstAmount / 2).toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-stone-700 font-medium text-xs pt-1 border-t border-stone-200">
                <span>Total Statutory GST ({gstRatePercent}%)</span>
                <span>₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-baseline font-serif font-bold text-lg text-stone-900 border-t border-stone-300 pt-3">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-[10px] text-stone-400 text-center">
                All Indian statutory hotel taxes included
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
