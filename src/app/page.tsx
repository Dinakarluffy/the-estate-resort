import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { testGeminiConnection } from "@/lib/gemini";
import { PrismaClient } from "@prisma/client";
import { Navbar } from "@/components/Navbar";
import { ReviewerRibbon } from "@/components/reviewer/ReviewerRibbon";
import { HomeBookingBar } from "@/components/home/HomeBookingBar";
import {
  Coffee,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Compass,
  Utensils,
  Waves,
  HeartHandshake,
  Clock,
  Tag,
  Check,
} from "lucide-react";

const prisma = new PrismaClient();

export default async function HomePage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("estate_session")?.value;
  const user = sessionToken ? await verifySessionToken(sessionToken) : null;
  const aiHealth = await testGeminiConnection();

  // Fetch live room categories
  const roomTypes = await prisma.roomType.findMany({
    orderBy: { basePrice: "asc" },
  });

  return (
    <div className="flex-1 flex flex-col bg-[#fbf9f6] text-stone-800 antialiased min-h-screen">
      {/* 1. Reviewer & Evaluator Launchpad Ribbon (Top Sticky Banner) */}
      <ReviewerRibbon aiHealth={aiHealth} currentUser={user} />

      {/* 2. Main Navigation */}
      <Navbar user={user} />

      {/* 3. Hero Section (Luxury Coffee Estate Sanctuary) */}
      <section className="relative min-h-[580px] sm:min-h-[640px] flex items-center justify-center bg-[#20291d] text-white overflow-hidden">
        {/* Ambient Dark Gradient & Background Image Simulation */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center opacity-40 scale-105 transition-transform duration-1000"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=2000&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#20291d] via-[#20291d]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#20291d]/80 via-transparent to-[#20291d]/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#e0d6cb] text-xs uppercase tracking-widest font-semibold">
            <Coffee className="w-3.5 h-3.5 text-amber-300" />
            <span>Chikkamagaluru, Karnataka • 76 Private Keys</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-[#faf7f2] tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Where the Mist Meets the Coffee Blossoms
          </h1>

          <p className="text-base sm:text-xl text-stone-200 max-w-2xl mx-auto font-light leading-relaxed">
            A secluded sanctuary nestled in the Western Ghats. 64 heritage rooms and 12 private pool villas surrounded by aromatic coffee plantations and timeless calm.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/rooms"
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2 group"
            >
              <span>Explore Rooms & Villas</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/events"
              className="px-6 py-3.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-sm font-semibold text-sm rounded-xl transition"
            >
              Weddings & Executive Offsites
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Interactive Direct Booking Bar (Floating over Hero bottom) */}
      <section className="px-4 relative z-20 pb-8">
        <HomeBookingBar />
      </section>

      {/* 5. Direct Booking Sanctuary Privileges (Solves 20% OTA leakage problem) */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7e5241]">
            Why Reserve Direct With The Estate
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2f392b]">
            Direct Guest Privileges
          </h2>
          <p className="text-sm text-stone-600">
            Booking directly through our website bypasses third-party agency markups, unlocking guaranteed best rates and curated plantation privileges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <Tag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-1">Guaranteed Best Rate</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Zero OTA 20% commission markups. You always get the lowest verified daily tariff, plus 10% off with promo code <strong>COFFEE10</strong>.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <Coffee className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-1">Complimentary Estate Walk</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every direct reservation includes a daily guided morning coffee plantation harvest tour and bean-to-cup cupping session.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-1">48-Hour Free Cancellation</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Plans change. Cancel up to 48 hours before check-in for an instant 100% refund, handled directly with no agent delays.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-1">Instant Confirmation & GST</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Transparent Indian GST calculation (12% vs 18%) with itemized CGST/SGST tax invoices provided on confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Sanctuary Accommodations (3 Distinct Categories, 76 Total Keys) */}
      <section className="bg-stone-100/70 border-y border-stone-200/60 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#7e5241]">
                Sanctuary Accommodations
              </span>
              <h2 className="text-3xl font-serif font-bold text-[#2f392b]">
                64 Heritage Rooms & 12 Private Pool Villas
              </h2>
              <p className="text-sm text-stone-600 max-w-xl">
                Crafted with local teakwood, stone masonry, and wide verandas capturing the mountain breeze across our 76 resort keys.
              </p>
            </div>
            <Link
              href="/rooms"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#384432] hover:text-[#252d21] group transition"
            >
              <span>View Live Rates & Availability</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roomTypes.map((room) => {
              const photos: string[] = JSON.parse(room.photos || "[]");
              const amenities: string[] = JSON.parse(room.amenities || "[]");
              const firstPhoto = photos[0] || "/images/rooms/heritage-1.jpg";

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Photo Container */}
                  <div className="relative h-60 w-full overflow-hidden bg-stone-200">
                    <img
                      src={firstPhoto}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-[11px] font-semibold">
                      {room.totalKeys} Physical Keys
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-stone-900 px-2.5 py-1 rounded-md text-[11px] font-bold">
                      Max {room.maxGuests} Guests
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-serif font-bold text-xl text-stone-900 group-hover:text-[#384432] transition">
                        {room.name}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                        {room.description}
                      </p>

                      {/* Amenities Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {amenities.slice(0, 3).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase font-semibold">From</span>
                        <div className="text-lg font-bold text-stone-900">
                          ₹{room.basePrice.toLocaleString("en-IN")}
                          <span className="text-xs font-normal text-stone-500"> / night</span>
                        </div>
                        <span className="text-[10px] text-stone-500">
                          + {room.basePrice > 7500 ? "18%" : "12%"} Statutory GST
                        </span>
                      </div>

                      <Link
                        href={`/rooms`}
                        className="px-4 py-2 bg-[#384432] hover:bg-[#252d21] text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1 group-hover:gap-1.5"
                      >
                        <span>Reserve</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. Weddings, Banquets & Executive Offsites (Solves the ₹72L/year Event Lead Problem) */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20 w-full">
        <div className="bg-gradient-to-r from-[#242d20] to-[#3a4734] rounded-3xl text-white p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none hidden md:block">
            <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('/images/rooms/villa-1.jpg')" }} />
          </div>

          <div className="max-w-xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Destination Events & Buyouts • Up to 350 Guests</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
              Celebrations Amidst The Coffee Hills
            </h2>

            <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-light">
              From picturesque open amphitheater wedding lawns accommodating 350 guests to secluded corporate leadership retreats with dedicated conference facilities. Our AI event curator and reservations team guarantee an official grounded rate quote in under 30 minutes.
            </p>

            <div className="grid grid-cols-2 gap-4 py-2 text-xs text-stone-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>350-Guest Amphitheater Lawns</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sub-30m SLA Quote Turnaround</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bespoke Malnad Estate Catering</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Exclusive Full-Estate Buyouts</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/events"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm rounded-xl shadow transition flex items-center gap-2"
              >
                <span>Submit Event & Wedding Enquiry</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Estate Curated Experiences */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7e5241]">
            Curated Experiences
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#2f392b]">
            Immerse in the Coffee Heritage
          </h2>
          <p className="text-sm text-stone-600">
            Every moment at The Estate is designed to connect you with the tranquility and rich coffee tradition of Chikkamagaluru.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#f4ebe1] text-[#7e5241] flex items-center justify-center mb-3">
              <Coffee className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-stone-900 mb-1">Bean-to-Cup Experience</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Harvest ripe Arabica cherries, learn artisan roasting techniques, and blend your personal estate roast.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#e8f1e5] text-[#384432] flex items-center justify-center mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-stone-900 mb-1">Mullayanagiri Hill Trails</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Guided morning treks along the highest peak of Karnataka with our resident botanists and bird naturalists.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#fcedeb] text-[#8e3831] flex items-center justify-center mb-3">
              <Utensils className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-stone-900 mb-1">Estate-to-Table Dining</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Traditional Malnad cuisine, organic estate vegetables, and fresh filter coffee served in our open courtyard.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#e6f2f8] text-[#2c6c94] flex items-center justify-center mb-3">
              <Waves className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-stone-900 mb-1">Valley View Plunge</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Temperature-controlled infinity waters overlooking mist-covered valleys and silver oak forests.
            </p>
          </div>
        </div>
      </section>

      {/* 9. Minimal Clean Footer */}
      <footer className="bg-[#1f261c] text-stone-400 text-xs py-12 border-t border-stone-800">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-serif font-bold text-base">
              <Coffee className="w-5 h-5 text-amber-400" />
              <span>The Estate Resort</span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              Mullayanagiri Hills, Chikkamagaluru, Karnataka 577101. 76 luxury keys across 64 heritage rooms and 12 private pool villas.
            </p>
            <p className="text-[11px] text-stone-500">
              © {new Date().getFullYear()} The Estate Resort. Direct-Booking Engine.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">Sanctuary</h5>
            <ul className="space-y-1.5">
              <li><Link href="/rooms" className="hover:text-white transition">Rooms & Villas</Link></li>
              <li><Link href="/events" className="hover:text-white transition">Weddings & Celebrations</Link></li>
              <li><Link href="/my-bookings" className="hover:text-white transition">My Reservations & Invoices</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Guest & Staff Portal</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">Direct Privileges</h5>
            <ul className="space-y-1.5 text-stone-400">
              <li>• Guaranteed Best Direct Tariff</li>
              <li>• Zero 20% OTA Commission Markup</li>
              <li>• 48-Hour Free Cancellation</li>
              <li>• Statutory Indian GST (SAC 996311)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-stone-200 uppercase tracking-wider text-[11px]">Operations & Admin</h5>
            <ul className="space-y-1.5">
              <li><Link href="/staff/dashboard" className="hover:text-amber-300 transition">• Staff AI Enquiry Inbox</Link></li>
              <li><Link href="/staff/bookings" className="hover:text-amber-300 transition">• Front Desk & Housekeeping</Link></li>
              <li><Link href="/admin/rates" className="hover:text-amber-300 transition">• GM 45-Day Rate & Allotment Matrix</Link></li>
              <li><a href="/api/health?detailed=true" target="_blank" className="hover:text-emerald-400 transition font-mono">• /api/health Diagnostics</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
