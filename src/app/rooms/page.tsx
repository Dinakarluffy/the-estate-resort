import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { Coffee, ShieldCheck, User, LogIn, Sparkles, CheckCircle2 } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { RoomCatalog } from "@/components/rooms/RoomCatalog";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "Rooms & Luxury Villas | The Estate Chikkamagaluru",
  description: "Browse heritage rooms, suites, and private plunge pool villas with live website allotment and statutory GST breakdown.",
};

export default async function RoomsPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("estate_session")?.value;
  const user = sessionToken ? await verifySessionToken(sessionToken) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      {/* Top Header */}
      <Navbar user={user} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-[#7e5241] font-bold">
            Direct Booking Sanctuary
          </span>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900">
            Rooms & Luxury Villas
          </h1>
          <p className="text-xs text-stone-500 max-w-2xl">
            Live website allotment directly connected to resort inventory. Zero OTA commission markup, verified best rate guarantee, and transparent statutory Indian GST breakdown.
          </p>
        </div>

        {/* Room Catalog Interactive Component */}
        <RoomCatalog />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ebded2] bg-white py-6 mt-12 text-center text-xs text-stone-500">
        <p>The Estate Resort • Chikkamagaluru, Karnataka • 76 Keys (64 Rooms + 12 Private Villas)</p>
        <p className="text-[11px] text-stone-400 mt-1">Direct Booking Sanctuary • Statutory Indian Hotel GST Tier Engine (12% / 18%)</p>
      </footer>
    </div>
  );
}
