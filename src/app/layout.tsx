import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Estate at Chikkamagaluru | Luxury Coffee Plantation Resort",
  description: "Direct booking and reservations for 76 luxury keys in the coffee hills of Chikkamagaluru, Karnataka.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased bg-[#fbf8f5] text-[#2e1c18]">
        {children}
      </body>
    </html>
  );
}
