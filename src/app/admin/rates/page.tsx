import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { ShieldCheck, Sliders, ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { RateAllotmentManager } from "@/components/admin/RateAllotmentManager";

export const metadata = {
  title: "Rate & Allotment Calendar | GM Control Panel",
  description: "General Manager inventory control, dynamic daily rates, website allotment caps, and blackout management.",
};

export default async function AdminRatesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("estate_session")?.value;
  const user = token ? await verifySessionToken(token) : null;

  if (!user || user.role !== "GM") {
    redirect("/login?redirect=/admin/rates");
  }

  return (
    <div className="min-h-screen bg-[#fbf8f5] p-3.5 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#ebded2] p-4 sm:p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-serif text-stone-900 leading-tight">
                Rate & Allotment Control Calendar
              </h1>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5">
                Dynamic pricing, website allotment caps, blackout dates, and promotional vouchers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 transition flex items-center gap-1.5 border border-stone-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>GM Dashboard</span>
            </Link>
            <SignOutButton variant="button" />
          </div>
        </div>

        {/* Inventory Guard Notice */}
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 shadow-2xs">
          <div>
            <strong className="text-amber-900 font-bold block mb-1 flex items-center gap-1.5">
              <span>🛡️ Allotment Protection Active (76 Keys Total)</span>
            </strong>
            <p className="text-amber-900/90 leading-relaxed text-[11px] sm:text-xs">
              The website sells strictly within the designated allotment (default 17 keys online). The remaining 59 keys are protected for offline corporate buyouts and travel agency contracts to eliminate double-booking risk.
            </p>
          </div>
          <span className="font-mono text-[10px] sm:text-[11px] px-3 py-1 rounded-full bg-amber-200/70 text-amber-950 font-bold shrink-0 self-start md:self-auto border border-amber-300">
            Zero-Overbooking Engine
          </span>
        </div>

        {/* Rate & Allotment Manager Component */}
        <RateAllotmentManager />
      </div>
    </div>
  );
}
