import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fbf8f5]">
      <div className="w-full max-w-md bg-white border border-red-200 rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-serif font-bold text-stone-900">Access Restricted</h1>
        <p className="text-sm text-stone-600 mt-2">
          Your current account role does not have permission to view this section.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full py-2.5 bg-[#384432] text-white rounded-lg text-sm font-medium hover:bg-[#2f392b] transition"
          >
            Switch Account / Sign In
          </Link>
          <Link
            href="/"
            className="w-full py-2.5 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
