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
    <div className="min-h-screen bg-[#fbf8f5] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#ebded2] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-stone-900">
                Rate & Allotment Control Calendar
              </h1>
              <p className="text-xs text-stone-600">
                Dynamic pricing, website allotment caps, blackout dates, and promotional vouchers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>GM Dashboard</span>
            </Link>
            <SignOutButton variant="button" />
          </div>
        </div>

        {/* Inventory Guard Notice */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <strong className="text-amber-900 font-bold block mb-0.5">
              🛡️ Allotment Protection Active (76 Keys Total)
            </strong>
            <span>
              The website sells strictly within the designated allotment (default 17 keys online). The remaining 59 keys are protected for offline corporate buyouts and travel agency contracts to eliminate double-booking risk.
            </span>
          </div>
          <span className="font-mono text-[11px] px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 font-bold shrink-0">
            Zero-Overbooking Engine
          </span>
        </div>

        {/* Rate & Allotment Manager Component */}
        <RateAllotmentManager />
      </div>
    </div>
  );
}
