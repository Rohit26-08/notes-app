import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "My Notes",
  description: "Personal notes & writing desk",
  other: {
    "google-adsense-account": "ca-pub-9087717513150666",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} h-full`}>
        <body className="h-full bg-[#0f0f13] text-zinc-300 antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
