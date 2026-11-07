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
import { GuestBookingsList, BookingItem } from "@/components/bookings/GuestBookingsList";

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

  const todayStr = new Date().toISOString().split("T")[0];
  const rawBookings = await getUserBookings(user.userId);

  const bookings: BookingItem[] = rawBookings.map((b) => {
    let photos: string[] = ["/images/rooms/heritage-1.jpg"];
    try {
      if (b.roomType && (b.roomType as any).photos) {
        photos = JSON.parse((b.roomType as any).photos);
      }
    } catch {}

    return {
      id: b.id,
      bookingNumber: b.bookingNumber,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      totalNights: b.totalNights,
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      grandTotal: b.grandTotal,
      netTaxableAmount: b.netTaxableAmount,
      gstAmount: b.gstAmount,
      gstRatePercent: b.gstRatePercent,
      status: b.status,
      paymentStatus: b.paymentStatus,
      promoCode: b.promoCode,
      createdAt: b.createdAt.toISOString(),
      roomType: {
        id: b.roomTypeId,
        name: b.roomType.name,
        slug: b.roomType.slug,
        basePrice: b.roomType.basePrice,
      },
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
              Guest Reservation Portal
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
          <GuestBookingsList initialBookings={bookings} todayStr={todayStr} />
        )}
      </main>
    </div>
  );
}
