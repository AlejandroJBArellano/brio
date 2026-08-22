import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brio — Command Center & Operating Dashboard",
  description:
    "Minimalist, zero-latency personal command center and Habitica batch synchronization hub.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-[#090a0f] text-neutral-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
        {/* Ambient background glow accents */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-175 h-87.5 bg-linear-to-tr from-indigo-600/10 via-violet-600/10 to-transparent blur-[120px]" />
          <div className="absolute top-1/3 -left-40 size-125 bg-linear-to-r from-sky-600/5 to-transparent blur-[100px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
