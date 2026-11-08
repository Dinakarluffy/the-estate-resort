"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Printer,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Loader2,
  X,
  CreditCard,
  Smartphone,
} from "lucide-react";

export interface BookingItem {
  id: string;
  bookingNumber: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  guestName: string;
  guestEmail: string;
  grandTotal: number;
  netTaxableAmount: number;
  gstAmount: number;
  gstRatePercent: number;
  status: string;
  paymentStatus: string;
  promoCode?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  roomType: {
    id?: string;
    name: string;
    slug: string;
    basePrice: number;
  };
  roomPhotos: string[];
}

interface GuestBookingsListProps {
  initialBookings: BookingItem[];
  todayStr: string;
}

export function GuestBookingsList({ initialBookings, todayStr }: GuestBookingsListProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [newCheckOut, setNewCheckOut] = useState("");
  const [extending, setExtending] = useState(false);
  const [extendMessage, setExtendMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Extend Stay Payment options
  const [extPaymentMethod, setExtPaymentMethod] = useState<"CARD_ON_FILE" | "UPI" | "NEW_CARD">("CARD_ON_FILE");
  const [extCardNumber, setExtCardNumber] = useState("4111 1111 1111 1111");
  const [extCardExpiry, setExtCardExpiry] = useState("12/28");
  const [extCardCvv, setExtCardCvv] = useState("123");
  const [extUpiId, setExtUpiId] = useState("guest@okhdfcbank");

  // Cancellation State
  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const openExtendModal = (b: BookingItem) => {
    setSelectedBooking(b);
    setExtendMessage(null);
    setExtPaymentMethod("CARD_ON_FILE");
    setExtCardNumber("4111 1111 1111 1111");
    setExtCardExpiry("12/28");
    setExtCardCvv("123");
    setExtUpiId("guest@okhdfcbank");
    const cur = new Date(b.checkOut);
    cur.setDate(cur.getDate() + 1);
    setNewCheckOut(cur.toISOString().split("T")[0]);
  };

  const closeExtendModal = () => {
    setSelectedBooking(null);
    setExtendMessage(null);
  };

  const openCancelModal = (b: BookingItem) => {
    setCancelTarget(b);
    setCancelMessage(null);
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelMessage(null);
  };

  const handleCancelBooking = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelMessage(null);

    try {
      const res = await fetch(`/api/bookings/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCancelMessage({ type: "error", text: data.error || "Failed to cancel reservation" });
      } else {
        setCancelMessage({
          type: "success",
          text: `Reservation ${cancelTarget.bookingNumber} successfully cancelled. 1 key has been restored to resort inventory and a refund of ₹${cancelTarget.grandTotal.toLocaleString("en-IN")} has been initiated.`,
        });

        // Update local state
        setBookings((prev) =>
          prev.map((item) =>
            item.id === cancelTarget.id
              ? {
                  ...item,
                  status: "CANCELLED",
                  paymentStatus: "REFUNDED",
                }
              : item
          )
        );

        setTimeout(() => {
          closeCancelModal();
        }, 2200);
      }
    } catch (err: any) {
      setCancelMessage({ type: "error", text: err.message || "Cancellation failed" });
    } finally {
      setCancelling(false);
    }
  };

  // Extension calculation
  let extNights = 0;
  let extBase = 0;
  let extGst = 0;
  let extGrandTotal = 0;

  if (selectedBooking && newCheckOut && newCheckOut > selectedBooking.checkOut) {
    const dStart = new Date(selectedBooking.checkOut);
    const dEnd = new Date(newCheckOut);
    const diffDays = Math.ceil((dEnd.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24));
    extNights = diffDays > 0 ? diffDays : 0;
    extBase = extNights * selectedBooking.roomType.basePrice;
    extGst = Math.round(((extBase * selectedBooking.gstRatePercent) / 100) * 100) / 100;
    extGrandTotal = extBase + extGst;
  }

  const handleExtendStay = async () => {
    if (!selectedBooking || !newCheckOut) return;
    setExtending(true);
    setExtendMessage(null);

    try {
      const payload: Record<string, any> = {
        bookingId: selectedBooking.id,
        newCheckOut,
      };

      if (extPaymentMethod === "UPI") {
        payload.paymentMethod = "UPI";
        payload.upiId = extUpiId.trim() || "guest@okhdfcbank";
      } else if (extPaymentMethod === "NEW_CARD") {
        payload.paymentMethod = "CARD";
        payload.cardNumber = extCardNumber.trim();
        payload.cardExpiry = extCardExpiry.trim();
        payload.cardCvv = extCardCvv.trim();
      } else {
        // CARD_ON_FILE - Charge tokenized card on file
        payload.paymentMethod = "CARD";
        payload.cardNumber = "4111 1111 1111 1111";
        payload.cardExpiry = "12/28";
        payload.cardCvv = "123";
      }

      const res = await fetch("/api/bookings/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setExtendMessage({ type: "error", text: data.error || "Extension failed" });
      } else {
        setExtendMessage({
          type: "success",
          text: `Stay successfully extended! New Check-out: ${newCheckOut} (11:00 AM). Updating receipt...`,
        });

        // Update local state
        setBookings((prev) =>
          prev.map((item) =>
            item.id === selectedBooking.id
              ? {
                  ...item,
                  checkOut: newCheckOut,
                  totalNights: item.totalNights + extNights,
                  grandTotal: item.grandTotal + extGrandTotal,
                  netTaxableAmount: item.netTaxableAmount + extBase,
                  gstAmount: item.gstAmount + extGst,
                }
              : item
          )
        );

        setTimeout(() => {
          closeExtendModal();
          router.push(`/confirmation/${selectedBooking.bookingNumber}`);
        }, 1500);
      }
    } catch (err: any) {
      setExtendMessage({ type: "error", text: err.message || "Failed to extend stay" });
    } finally {
      setExtending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs text-stone-500 px-1">
        <span>Showing {bookings.length} {bookings.length === 1 ? "reservation" : "reservations"}</span>
        <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-Time Allotment Protected</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {bookings.map((booking, idx) => {
          const isCancelled = booking.status === "CANCELLED";
          const isConfirmed = booking.status === "CONFIRMED";
          // Business rule: Can ONLY extend if booking is active/upcoming (current date < checkout date)
          const canExtend = isConfirmed && todayStr < booking.checkOut;
          const isPastStay = isConfirmed && booking.checkOut <= todayStr;

          return (
            <div
              key={booking.id}
              className={`rounded-2xl overflow-hidden transition flex flex-col md:flex-row group ${
                isCancelled
                  ? "bg-stone-50/80 border border-stone-200 opacity-80 shadow-none"
                  : "bg-white border border-[#ebded2] shadow-sm hover:shadow-md"
              }`}
            >
              {/* Room Thumbnail Photo */}
              <div className="md:w-72 h-48 md:h-auto min-h-[190px] relative bg-stone-900 overflow-hidden shrink-0">
                <img
                  src={booking.roomPhotos[0]}
                  alt={booking.roomType.name}
                  className={`w-full h-full object-cover transition duration-300 ${isCancelled ? "grayscale" : "group-hover:scale-105"}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                {/* Status Badge Over Image */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-sm ${
                      isCancelled
                        ? "bg-red-700/95 text-white flex items-center gap-1"
                        : isPastStay
                        ? "bg-stone-700/90 text-stone-200"
                        : "bg-emerald-700/90 text-white"
                    }`}
                  >
                    {isCancelled ? (
                      <>
                        <X className="w-3 h-3" />
                        <span>CANCELLED</span>
                      </>
                    ) : isPastStay ? (
                      "COMPLETED STAY"
                    ) : (
                      "CONFIRMED"
                    )}
                  </span>
                </div>

                {/* Room Name Overlay */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">
                    Stay #{idx + 1}
                  </span>
                  <h4 className="text-sm font-serif font-bold truncate">
                    {booking.roomType.name}
                  </h4>
                </div>
              </div>

              {/* Booking Information Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Top Bar: Booking Reference & Date Created / Cancelled */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-medium">Booking Reference:</span>
                    <span className="font-mono font-bold text-[#384432] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-xs">
                      {booking.bookingNumber}
                    </span>
                  </div>

                  {/* Header Date: If cancelled, show exact cancellation date; otherwise booked date */}
                  {isCancelled ? (
                    <div className="text-[11px] text-red-700 font-semibold flex items-center gap-1.5 bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                      <X className="w-3.5 h-3.5 text-red-600" />
                      <span>
                        Cancelled on{" "}
                        {new Date(booking.updatedAt || booking.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Booked on{" "}
                        {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Middle: Stay Schedule & Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Check-in */}
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80">
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">
                      Check-in
                    </span>
                    <strong className="text-stone-900 text-xs block mt-0.5">
                      {booking.checkIn}
                    </strong>
                    <span className="text-[10px] text-stone-500">2:00 PM Afternoon</span>
                  </div>

                  {/* Check-out */}
                  <div className={`p-2.5 rounded-xl border ${isPastStay ? "bg-stone-100/60 border-stone-200" : "bg-stone-50 border-stone-200/80"}`}>
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">
                      Check-out
                    </span>
                    <strong className="text-stone-900 text-xs block mt-0.5">
                      {booking.checkOut}
                    </strong>
                    <span className="text-[10px] text-stone-500">
                      {isCancelled ? "Cancelled" : isPastStay ? "Departed (11:00 AM)" : "11:00 AM Departure"}
                    </span>
                  </div>

                  {/* Duration & Guests */}
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80">
                    <span className="text-[10px] text-stone-400 font-bold uppercase block">
                      Duration & Guest
                    </span>
                    <strong className="text-stone-900 text-xs block mt-0.5">
                      {booking.totalNights} {booking.totalNights === 1 ? "Night" : "Nights"} Stay
                    </strong>
                    <span className="text-[10px] text-stone-500 truncate block">
                      {booking.guestName}
                    </span>
                  </div>
                </div>

                {/* Bottom Bar: Financials & Action Buttons */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    {isCancelled ? (
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="text-stone-400">Total Refund:</span>
                        <span className="font-serif font-bold text-lg text-stone-400 line-through">
                          ₹{booking.grandTotal.toLocaleString("en-IN")}
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                          REFUNDED
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="text-stone-500">Amount Paid:</span>
                        <span className="font-serif font-bold text-lg text-stone-900">
                          ₹{booking.grandTotal.toLocaleString("en-IN")}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {booking.paymentStatus}
                        </span>
                        {booking.promoCode && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            <span>{booking.promoCode} applied</span>
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-[10px] text-stone-400">
                      {isCancelled
                        ? "Reservation cancelled and 1 key restored to resort inventory."
                        : `Statutory Invoice: Net ₹${booking.netTaxableAmount.toLocaleString("en-IN")} + ${booking.gstRatePercent}% GST (₹${booking.gstAmount.toLocaleString("en-IN")}) • SAC 996311`}
                    </div>
                  </div>

                  {/* Actions: IF CANCELLED, HIDE ALL ACTION BUTTONS! */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isCancelled ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                        <X className="w-3.5 h-3.5 text-red-600" />
                        <span>Booking Cancelled & Refunded</span>
                      </span>
                    ) : (
                      <>
                        {/* View Tax Invoice Voucher */}
                        <Link
                          href={`/confirmation/${booking.bookingNumber}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-600" />
                          <span>View Tax Invoice</span>
                        </Link>

                        {/* Cancel Stay Button: Available for active confirmed stays */}
                        {isConfirmed && !isPastStay && (
                          <button
                            type="button"
                            onClick={() => openCancelModal(booking)}
                            className="inline-flex items-center gap-1 px-3 py-2 text-stone-500 hover:text-red-700 hover:bg-red-50 rounded-xl text-xs font-semibold transition"
                          >
                            <span>Cancel Stay</span>
                          </button>
                        )}

                        {/* Manage/Extend Stay Button: ONLY shown if current date < checkout date */}
                        {canExtend ? (
                          <button
                            type="button"
                            onClick={() => openExtendModal(booking)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#384432] hover:bg-[#283224] text-white rounded-xl text-xs font-semibold transition shadow-sm"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Extend Stay</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-400 text-xs font-medium border border-stone-200/80">
                            <CheckCircle2 className="w-3 h-3 text-stone-400" />
                            <span>Past Stay</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extension Modal on /my-bookings */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-[9999] bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={closeExtendModal}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-left space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Extend Your Resort Stay
                  </h3>
                  <p className="text-xs text-stone-500">
                    Reservation #{selectedBooking.bookingNumber} • {selectedBooking.roomType.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeExtendModal}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Schedule Banner */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>Current Check-in: {selectedBooking.checkIn} (2:00 PM)</span>
                <span>Current Check-out: {selectedBooking.checkOut} (11:00 AM)</span>
              </div>
              <div className="text-[11px] text-amber-800">
                Duration: {selectedBooking.totalNights} Nights • Total Paid: ₹{selectedBooking.grandTotal.toLocaleString("en-IN")} (PAID)
              </div>
            </div>

            {/* Feedback Message */}
            {extendMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  extendMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {extendMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{extendMessage.text}</span>
              </div>
            )}

            {/* Date Input & Pricing */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                  Select New Check-out Date (Departure at 11:00 AM)
                </label>
                <input
                  type="date"
                  value={newCheckOut}
                  min={(() => {
                    const d = new Date(selectedBooking.checkOut);
                    d.setDate(d.getDate() + 1);
                    return d.toISOString().split("T")[0];
                  })()}
                  onChange={(e) => setNewCheckOut(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium focus:ring-2 focus:ring-[#384432] focus:outline-none"
                />
              </div>

              {newCheckOut && newCheckOut > selectedBooking.checkOut && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span>New Check-out: {newCheckOut} at 11:00 AM</span>
                    <span>+{extNights} {extNights === 1 ? "Night" : "Nights"} Added</span>
                  </div>
                  <div className="text-[10px] text-emerald-800">
                    New Total Duration: <strong>{selectedBooking.totalNights + extNights} Nights</strong>
                  </div>
                  <div className="text-[10px] text-emerald-700 pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                    <span>Pro-rated: ₹{extBase.toLocaleString("en-IN")} + {selectedBooking.gstRatePercent}% GST (₹{extGst.toLocaleString("en-IN")})</span>
                    <strong className="text-xs">Pay: ₹{extGrandTotal.toLocaleString("en-IN")}</strong>
                  </div>
                  <div className="text-[9px] text-stone-500 italic pt-0.5">
                    ℹ️ Standard Check-out is 11:00 AM (Housekeeping window 11:00 AM - 2:00 PM before new arrivals).
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              {newCheckOut && newCheckOut > selectedBooking.checkOut && extGrandTotal > 0 && (
                <div className="space-y-2 pt-1 border-t border-stone-200">
                  <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                    Payment Method for Difference (₹{extGrandTotal.toLocaleString("en-IN")})
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setExtPaymentMethod("CARD_ON_FILE")}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        extPaymentMethod === "CARD_ON_FILE"
                          ? "border-[#384432] bg-[#384432]/5 text-[#384432] ring-1 ring-[#384432]"
                          : "border-stone-200 hover:border-stone-300 text-stone-700 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <CreditCard className="w-4 h-4 text-[#384432]" />
                        {extPaymentMethod === "CARD_ON_FILE" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#384432]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[11px] leading-tight">Card on File</p>
                        <p className="text-[9px] text-stone-500">•••• 4242</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExtPaymentMethod("UPI")}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        extPaymentMethod === "UPI"
                          ? "border-[#384432] bg-[#384432]/5 text-[#384432] ring-1 ring-[#384432]"
                          : "border-stone-200 hover:border-stone-300 text-stone-700 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Smartphone className="w-4 h-4 text-[#384432]" />
                        {extPaymentMethod === "UPI" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#384432]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[11px] leading-tight">Instant UPI</p>
                        <p className="text-[9px] text-stone-500">VPA / Fast Pay</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExtPaymentMethod("NEW_CARD")}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        extPaymentMethod === "NEW_CARD"
                          ? "border-[#384432] bg-[#384432]/5 text-[#384432] ring-1 ring-[#384432]"
                          : "border-stone-200 hover:border-stone-300 text-stone-700 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <CreditCard className="w-4 h-4 text-stone-600" />
                        {extPaymentMethod === "NEW_CARD" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#384432]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[11px] leading-tight">New Card</p>
                        <p className="text-[9px] text-stone-500">Credit / Debit</p>
                      </div>
                    </button>
                  </div>

                  {/* Payment subfields */}
                  {extPaymentMethod === "CARD_ON_FILE" && (
                    <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-stone-600 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Pre-authorized Card: <strong>Visa ending in 4242</strong></span>
                      </div>
                      <span className="text-[9px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                        1-Click Instant Charge
                      </span>
                    </div>
                  )}

                  {extPaymentMethod === "UPI" && (
                    <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg space-y-1">
                      <label className="block text-[9px] font-bold text-stone-500 uppercase">
                        UPI ID / VPA
                      </label>
                      <input
                        type="text"
                        value={extUpiId}
                        onChange={(e) => setExtUpiId(e.target.value)}
                        placeholder="guest@okhdfcbank"
                        className="w-full px-2.5 py-1.5 rounded border border-stone-300 text-xs font-mono focus:ring-1 focus:ring-[#384432] focus:outline-none"
                      />
                    </div>
                  )}

                  {extPaymentMethod === "NEW_CARD" && (
                    <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg space-y-2">
                      <div>
                        <label className="block text-[9px] font-bold text-stone-500 uppercase">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={extCardNumber}
                          onChange={(e) => setExtCardNumber(e.target.value)}
                          placeholder="4111 1111 1111 1111"
                          className="w-full px-2.5 py-1.5 rounded border border-stone-300 text-xs font-mono focus:ring-1 focus:ring-[#384432] focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 uppercase">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={extCardExpiry}
                            onChange={(e) => setExtCardExpiry(e.target.value)}
                            placeholder="12/28"
                            className="w-full px-2.5 py-1.5 rounded border border-stone-300 text-xs font-mono focus:ring-1 focus:ring-[#384432] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 uppercase">
                            CVV
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            value={extCardCvv}
                            onChange={(e) => setExtCardCvv(e.target.value)}
                            placeholder="123"
                            className="w-full px-2.5 py-1.5 rounded border border-stone-300 text-xs font-mono focus:ring-1 focus:ring-[#384432] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeExtendModal}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={extending || !newCheckOut || newCheckOut <= selectedBooking.checkOut}
                  onClick={handleExtendStay}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 shadow"
                >
                  {extending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying & Extending...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay {extGrandTotal > 0 ? `₹${extGrandTotal.toLocaleString("en-IN")}` : "Difference"} & Confirm Extension</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal on /my-bookings */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-[9999] bg-stone-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={closeCancelModal}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 text-left space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Cancel Reservation
                  </h3>
                  <p className="text-xs text-stone-500">
                    Reference #{cancelTarget.bookingNumber} • {cancelTarget.roomType.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCancelModal}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cancel Message Banner */}
            {cancelMessage && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  cancelMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {cancelMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{cancelMessage.text}</span>
              </div>
            )}

            {/* Dynamic 48-Hour Cancellation Policy Evaluation */}
            {(() => {
              const checkInDateTime = new Date(`${cancelTarget.checkIn}T14:00:00`);
              const hoursUntilCheckIn = (checkInDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
              const isFreeEligible = hoursUntilCheckIn >= 48;

              if (isFreeEligible) {
                return (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>100% Free Cancellation Policy Applies</span>
                        </span>
                        <span className="font-mono bg-emerald-200/80 px-2 py-0.5 rounded text-[11px] text-emerald-900">
                          {Math.max(1, Math.round(hoursUntilCheckIn / 24))} Days to Check-in
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Your check-in is scheduled for <strong>{cancelTarget.checkIn} at 2:00 PM</strong> (more than 48 hours away). 
                        Under our direct booking policy, you are eligible for an immediate full refund of <strong>₹{cancelTarget.grandTotal.toLocaleString("en-IN")}</strong>.
                      </p>
                      <div className="text-[10px] text-emerald-700 pt-1 border-t border-emerald-200/60">
                        • 1 room key will be automatically returned to live website allotment.<br />
                        • Refund will be credited to original payment reference: <code>{cancelTarget.bookingNumber}</code>.
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={closeCancelModal}
                        className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-100 transition"
                      >
                        Keep Reservation
                      </button>
                      <button
                        type="button"
                        disabled={cancelling}
                        onClick={handleCancelBooking}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                      >
                        {cancelling ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          <span>Confirm Cancellation & Refund ₹{cancelTarget.grandTotal.toLocaleString("en-IN")}</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950">
                      <div className="flex items-center justify-between font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          <span>Within 48-Hour Late Cancellation Window</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Your check-in is on <strong>{cancelTarget.checkIn} at 2:00 PM</strong> (less than 48 hours away).
                        Per resort operations policy, automated online cancellations close 48 hours before arrival.
                      </p>
                      <div className="p-2.5 bg-white/80 rounded-lg border border-amber-300/60 text-[11px] text-stone-700 space-y-0.5">
                        <strong>Front Desk Duty Hotline:</strong>
                        <div>Direct Phone: +91 8262 290123 / +91 98765 43213</div>
                        <div>Email: reservations@estate.com</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <button
                        type="button"
                        onClick={closeCancelModal}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
