import Link from "next/link";
import { ShieldAlert, LogIn, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: { from?: string };
}) {
  const from = searchParams?.from || "";
  const isAdminTarget = from.startsWith("/admin");
  const isStaffTarget = from.startsWith("/staff");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fbf8f5]">
      <div className="w-full max-w-md bg-white border border-red-200 rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-serif font-bold text-stone-900">Access Restricted</h1>
        <p className="text-sm text-stone-600 mt-2">
          {isAdminTarget
            ? "This management console requires General Manager (GM) credentials."
            : isStaffTarget
            ? "This operational section requires Hotel Staff or General Manager credentials."
            : "Your current account role does not have permission to view this section."}
        </p>

        {from && (
          <p className="text-[11px] font-mono text-stone-500 mt-1 bg-stone-100 py-1 px-2 rounded">
            Target: {from}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={from ? `/login?from=${encodeURIComponent(from)}` : "/login"}
            className="w-full py-2.5 bg-[#384432] text-white rounded-lg text-sm font-medium hover:bg-[#2f392b] transition flex items-center justify-center gap-2 shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            <span>Switch Account / Sign In</span>
          </Link>
          <Link
            href="/"
            className="w-full py-2.5 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
