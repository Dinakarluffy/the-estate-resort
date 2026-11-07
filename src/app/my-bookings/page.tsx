import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { getUserBookings } from "@/lib/booking";
import {
  Coffee,
  Calendar,
  Clock,
  CheckCircle2,
  Printer,
  ArrowRight,
  ShieldCheck,
  User,
  AlertCircle,
  FileText,
  Bed,
  Tag,
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata = {
  title: "My Reservations | The Estate Chikkamagaluru",
  description: "View and manage your direct resort reservations, stay schedules, and official GST tax invoices.",
};

export default async function MyBookingsPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("estate_session")?.value;
  const user = sessionToken ? await verifySessionToken(sessionToken) : null;

  if (!user) {
    redirect("/login?redirect=/my-bookings");
  }

  const rawBookings = await getUserBookings(user.userId);

  const bookings = rawBookings.map((b) => {
    let photos: string[] = ["/images/rooms/heritage-1.jpg"];
    try {
      if (b.roomType && (b.roomType as any).photos) {
        photos = JSON.parse((b.roomType as any).photos);
      }
    } catch {}

    return {
      ...b,
      roomPhotos: photos,
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      {/* Top Header */}
      <header className="border-b border-[#ebded2] bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#384432] text-white flex items-center justify-center shadow-sm">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-[#2f392b] block leading-tight">
                The Estate
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#7e5241] block">
                Chikkamagaluru
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition px-2 py-1"
            >
              Home
            </Link>
            <Link
              href="/rooms"
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition px-2 py-1"
            >
              Rooms & Villas
            </Link>
            <Link
              href="/my-bookings"
              className="text-xs font-bold text-[#384432] px-2 py-1 border-b-2 border-[#384432]"
            >
              My Bookings ({bookings.length})
            </Link>

            <div className="flex items-center gap-2.5 ml-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5efe8] rounded-full border border-[#ebded2] text-xs">
                <User className="w-3.5 h-3.5 text-stone-600" />
                <span className="font-medium text-stone-800">{user.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#384432] text-white">
                  {user.role}
                </span>
              </div>
              <SignOutButton />
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Page Title & Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#ebded2]">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#7e5241] font-bold block">
              Guest Portal • DPDP Act Protected
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mt-0.5">
              My Reservation History
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Active stays, booking vouchers, and statutory Indian GST tax receipts for {user.name} ({user.email}).
            </p>
          </div>

          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#384432] hover:bg-[#283224] text-white rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto shrink-0"
          >
            <Bed className="w-4 h-4" />
            <span>Book Another Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-white border border-[#ebded2] rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-serif font-bold text-stone-900">
                No Reservations Found Yet
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                You haven't completed any direct bookings yet. Reserve your stay with verified best direct rate guarantee and zero OTA commission.
              </p>
            </div>
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#384432] hover:bg-[#283224] text-white rounded-xl text-xs font-bold transition shadow"
            >
              <span>Explore Rooms & Luxury Villas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-stone-500 px-1">
              <span>Showing {bookings.length} {bookings.length === 1 ? "reservation" : "reservations"}</span>
              <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Confirmation & Real-Time Allotment</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {bookings.map((booking, idx) => {
                const isConfirmed = booking.status === "CONFIRMED";
                const isCancelled = booking.status === "CANCELLED";

                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-[#ebded2] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col md:flex-row group"
                  >
                    {/* Room Thumbnail Photo */}
                    <div className="md:w-72 h-48 md:h-auto min-h-[190px] relative bg-stone-900 overflow-hidden shrink-0">
                      <img
                        src={booking.roomPhotos[0]}
                        alt={booking.roomType.name}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                      {/* Status Badge Over Image */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-sm ${
                            isConfirmed
                              ? "bg-emerald-700/90 text-white"
                              : "bg-stone-800/90 text-stone-200"
                          }`}
                        >
                          {booking.status}
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
                      {/* Top Bar: Booking ID & Date Created */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 font-medium">Booking Reference:</span>
                          <span className="font-mono font-bold text-[#384432] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 text-xs">
                            {booking.bookingNumber}
                          </span>
                        </div>

                        <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Booked on {new Date(booking.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
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
                        <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80">
                          <span className="text-[10px] text-stone-400 font-bold uppercase block">
                            Check-out
                          </span>
                          <strong className="text-stone-900 text-xs block mt-0.5">
                            {booking.checkOut}
                          </strong>
                          <span className="text-[10px] text-stone-500">11:00 AM Departure</span>
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
                          <div className="flex items-center gap-2 text-xs">
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
                          <div className="text-[10px] text-stone-400">
                            Statutory Invoice: Net ₹{booking.netTaxableAmount.toLocaleString("en-IN")} + {booking.gstRatePercent}% GST (₹{booking.gstAmount.toLocaleString("en-IN")}) • SAC 996311
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/confirmation/${booking.bookingNumber}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition"
                          >
                            <Printer className="w-3.5 h-3.5 text-stone-600" />
                            <span>View Tax Invoice</span>
                          </Link>

                          <Link
                            href="/rooms"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#384432] hover:bg-[#283224] text-white rounded-xl text-xs font-semibold transition shadow-sm"
                          >
                            <span>Manage / Extend</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
