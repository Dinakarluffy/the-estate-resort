import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { getBookingById, getBookingByNumber } from "@/lib/booking";
import {
  CheckCircle2,
  Coffee,
  Calendar,
  User,
  ShieldCheck,
  Tag,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { PrintButton } from "@/components/booking/PrintButton";
import { Navbar } from "@/components/Navbar";

interface ConfirmationPageProps {
  params: { id: string };
}

export const metadata = {
  title: "Booking Confirmed | The Estate Chikkamagaluru",
  description: "Official direct booking confirmation receipt and statutory GST tax invoice.",
};

export default async function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = params;
  let booking = await getBookingById(id);
  if (!booking) {
    booking = await getBookingByNumber(id);
  }

  if (!booking) {
    notFound();
  }

  const cookieStore = cookies();
  const sessionToken = cookieStore.get("estate_session")?.value;
  const user = sessionToken ? await verifySessionToken(sessionToken) : null;

  let photos: string[] = [];
  try {
    photos = JSON.parse(booking.roomType.photos);
  } catch {
    photos = ["/images/rooms/heritage-1.jpg"];
  }

  const halfGstRate = booking.gstRatePercent / 2;
  const halfGstAmount = Math.round((booking.gstAmount / 2) * 100) / 100;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      {/* Top Header */}
      <Navbar user={user} />

      {/* Main Voucher Container */}
      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Success Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2 shadow-sm print:hidden">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-emerald-950">
            Booking Confirmed & Guaranteed
          </h1>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            Thank you, <strong>{booking.guestName}</strong>! Your direct reservation has been recorded and website allotment has been secured.
          </p>
        </div>

        {/* Printable Official Receipt Card */}
        <div className="bg-white border border-[#ebded2] rounded-3xl p-6 md:p-10 shadow-lg space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Receipt Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-[#384432]" />
                <span className="font-serif font-bold text-xl text-stone-900">
                  The Estate Resort
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>Mullayanagiri Hills, Chikkamagaluru, Karnataka 577101</span>
              </p>
              <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                GSTIN: 29AABCE1234F1Z5 • SAC: 996311 (Accommodation)
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                Official Booking Reference
              </span>
              <strong className="text-xl font-mono text-emerald-800 block">
                {booking.bookingNumber}
              </strong>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {booking.status} • {booking.paymentStatus}
              </span>
            </div>
          </div>

          {/* Guest & Reservation Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                Primary Guest Profile
              </span>
              <div className="font-bold text-sm text-stone-900">{booking.guestName}</div>
              <div className="text-stone-600 font-mono">{booking.guestEmail}</div>
              <div className="text-stone-600">{booking.guestPhone}</div>
            </div>

            <div className="space-y-2 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                Stay Schedule
              </span>
              <div className="flex justify-between">
                <span className="text-stone-500">Check-in:</span>
                <strong className="text-stone-900">{booking.checkIn} (2:00 PM)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Check-out:</span>
                <strong className="text-stone-900">{booking.checkOut} (11:00 AM)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Duration:</span>
                <strong className="text-stone-900">{booking.totalNights} {booking.totalNights === 1 ? "Night" : "Nights"}</strong>
              </div>
            </div>
          </div>

          {/* Room Details Banner */}
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-[#ebded2] bg-[#fbf9f6]">
            <img
              src={photos[0] || "/images/rooms/heritage-1.jpg"}
              alt={booking.roomType.name}
              className="w-20 h-20 rounded-xl object-cover shrink-0 shadow-sm"
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7e5241] block">
                Confirmed Room Type
              </span>
              <h3 className="font-serif font-bold text-base text-stone-900">
                {booking.roomType.name}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Chikkamagaluru Coffee Estate • Teakwood furnishings, private balcony, artisanal coffee bar
              </p>
            </div>
          </div>

          {/* Statutory Indian GST Tax Invoice Breakdown Table */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-sm text-stone-900">
              Statutory Tax Invoice Breakdown (INR)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
                <thead className="bg-stone-100 text-stone-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">SAC Code</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-2.5 px-3">
                      Accommodation Tariff ({booking.totalNights} Nights)
                    </td>
                    <td className="py-2.5 px-3 font-mono text-stone-500">996311</td>
                    <td className="py-2.5 px-3 text-right font-medium">
                      ₹{booking.baseTariffTotal.toLocaleString("en-IN")}
                    </td>
                  </tr>

                  {booking.discountAmount > 0 && (
                    <tr className="text-emerald-700 bg-emerald-50/50">
                      <td className="py-2.5 px-3 font-medium">
                        Direct Booking Discount ({booking.promoCode || "PROMO"})
                      </td>
                      <td className="py-2.5 px-3 font-mono">—</td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        -₹{booking.discountAmount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-stone-50/70 font-semibold">
                    <td className="py-2.5 px-3">Net Taxable Accommodation Value</td>
                    <td className="py-2.5 px-3 font-mono">996311</td>
                    <td className="py-2.5 px-3 text-right">
                      ₹{booking.netTaxableAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 px-3 text-stone-600">
                      Central GST (CGST) @ {halfGstRate}%
                    </td>
                    <td className="py-2 px-3 font-mono text-stone-400">996311</td>
                    <td className="py-2 px-3 text-right">
                      ₹{halfGstAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2 px-3 text-stone-600">
                      Karnataka State GST (SGST) @ {halfGstRate}%
                    </td>
                    <td className="py-2 px-3 font-mono text-stone-400">996311</td>
                    <td className="py-2 px-3 text-right">
                      ₹{halfGstAmount.toLocaleString("en-IN")}
                    </td>
                  </tr>

                  <tr className="bg-stone-900 text-white font-bold text-sm">
                    <td className="py-3 px-3">Total Amount Paid (Inclusive of GST)</td>
                    <td className="py-3 px-3 font-mono text-stone-300">{booking.gstRatePercent}% GST</td>
                    <td className="py-3 px-3 text-right font-serif">
                      ₹{booking.grandTotal.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-500 pt-2 gap-2">
              <div>
                <span>Payment Reference: </span>
                <strong className="font-mono text-stone-800">{booking.paymentReference}</strong>
              </div>
              <div>
                <span>Booked On: </span>
                <strong className="text-stone-800">{new Date(booking.createdAt).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Important Arrival Policies */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1 text-xs text-stone-600">
            <strong className="text-stone-900 block">Resort Arrival Information:</strong>
            <p className="text-[11px] leading-relaxed">
              • Check-in is from 2:00 PM. Early check-in is subject to availability upon arrival.<br />
              • Complimentary artisanal coffee tasting and plantation walkthrough included each morning.<br />
              • Free cancellation available up to 48 hours prior to check-in date.
            </p>
          </div>

          {/* Actions (Hidden on Print) */}
          <div className="pt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4 print:hidden">
            <Link
              href="/rooms"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Rooms Catalog</span>
            </Link>

            <div className="flex items-center gap-3">
              <PrintButton />
              <Link
                href="/my-bookings"
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition"
              >
                My Bookings History
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 bg-[#384432] hover:bg-[#2c3627] text-white rounded-xl text-xs font-bold transition shadow"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ebded2] bg-white py-6 mt-12 text-center text-xs text-stone-500 print:hidden">
        <p>The Estate Resort • Chikkamagaluru, Karnataka • Official Direct Booking Voucher</p>
        <p className="text-[11px] text-stone-400 mt-1">Verified Direct Booking Receipt • Statutory Indian Hotel GST Tier Engine</p>
      </footer>
    </div>
  );
}
