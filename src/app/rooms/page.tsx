import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { Coffee, ShieldCheck, User, LogIn, Sparkles, CheckCircle2 } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { RoomCatalog } from "@/components/rooms/RoomCatalog";

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
              className="text-xs font-bold text-[#384432] px-2 py-1 border-b-2 border-[#384432]"
            >
              Rooms & Villas
            </Link>

            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5efe8] rounded-full border border-[#ebded2] text-xs">
                  {user.role === "GM" ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  ) : user.role === "STAFF" ? (
                    <Coffee className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-stone-600" />
                  )}
                  <span className="font-medium text-stone-800">{user.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#384432] text-white">
                    {user.role}
                  </span>
                </div>

                {user.role === "GM" && (
                  <Link
                    href="/admin/dashboard"
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                  >
                    GM Panel
                  </Link>
                )}

                {(user.role === "STAFF" || user.role === "GM") && (
                  <Link
                    href="/staff/dashboard"
                    className="px-3 py-1.5 text-xs font-semibold bg-[#384432] hover:bg-[#2f392b] text-white rounded-lg transition"
                  >
                    Staff Inbox
                  </Link>
                )}

                <SignOutButton />
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded-lg border border-[#384432] text-[#384432] hover:bg-stone-100 text-xs font-semibold transition"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#384432] hover:bg-[#2f392b] text-white text-xs font-semibold shadow-sm transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

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
        <p className="text-[11px] text-stone-400 mt-1">DPDP Act 2023 Compliant • Indian Hotel GST Tier Engine (12% / 18%)</p>
      </footer>
    </div>
  );
}
