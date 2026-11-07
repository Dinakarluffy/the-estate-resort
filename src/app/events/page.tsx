import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { Coffee, ArrowRight, Sparkles, LogIn, Calendar, Users, HeartHandshake } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { EventEnquiryWizard } from "@/components/events/EventEnquiryWizard";

export const metadata = {
  title: "Weddings & Corporate Offsites | The Estate Chikkamagaluru",
  description: "Luxury coffee estate destination weddings, leadership offsites, and group buyouts with real-time AI enquiry routing.",
};

export default async function EventsPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  const user = token ? await verifySessionToken(token) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2]">
      {/* Top Header */}
      <header className="border-b border-[#ebded2] bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#384432] text-amber-100 flex items-center justify-center shadow-xs">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-base tracking-tight text-stone-900 block leading-tight">
                The Estate
              </span>
              <span className="text-[10px] tracking-widest uppercase text-stone-500 font-sans block">
                Chikkamagaluru
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-xs font-medium text-stone-700">
            <Link href="/" className="hover:text-[#384432] transition">
              Home
            </Link>
            <Link href="/rooms" className="hover:text-[#384432] transition">
              Rooms & Villas
            </Link>
            <Link href="/events" className="text-[#384432] font-bold">
              Weddings & Events
            </Link>
            {user && (
              <Link href="/my-bookings" className="hover:text-[#384432] transition">
                My Stays
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-stone-200">
                <span className="text-xs text-stone-600 font-medium">
                  {user.name}
                </span>

                {user.role === "GM" && (
                  <Link
                    href="/admin/dashboard"
                    className="px-2.5 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                  >
                    GM Panel
                  </Link>
                )}

                {(user.role === "STAFF" || user.role === "GM") && (
                  <Link
                    href="/staff/dashboard"
                    className="px-2.5 py-1 text-[11px] font-semibold bg-[#384432] hover:bg-[#2f392b] text-white rounded-lg transition"
                  >
                    Staff Inbox
                  </Link>
                )}

                <SignOutButton />
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
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

      {/* Hero Section */}
      <section className="bg-white border-b border-[#ebded2] py-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            Mullayanagiri Hills Destination Gatherings
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-stone-900 leading-tight">
            Curated Weddings & Executive Corporate Retreats
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto leading-relaxed">
            76 luxury keys, open-air estate amphitheaters, banquet lawns, and bespoke plantation culinary experiences. Inquire below for guaranteed under-2-minute quote dispatch.
          </p>
        </div>
      </section>

      {/* Main Form Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <EventEnquiryWizard />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ebded2] bg-white py-6 text-center text-xs text-stone-500">
        The Estate Resort • Mullayanagiri, Chikkamagaluru, Karnataka • AI Enquiry Router & Hospitality Platform
      </footer>
    </div>
  );
}
