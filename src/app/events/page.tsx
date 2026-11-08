import Link from "next/link";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { Coffee, ArrowRight, Sparkles, LogIn, Calendar, Users, HeartHandshake } from "lucide-react";
import { EventEnquiryWizard } from "@/components/events/EventEnquiryWizard";
import { Navbar } from "@/components/Navbar";

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
      <Navbar user={user} />

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
    </div>
  );
}
