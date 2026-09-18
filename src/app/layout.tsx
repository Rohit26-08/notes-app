import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const SITE_URL = "https://mynotepad.site";
const SITE_TITLE = "My Notes — Daily Notepad, Time Management & Script Writing";
const SITE_DESCRIPTION =
  "A simple online notepad for daily journaling, hour-by-hour time management, weekly goal tracking, and writing scripts or articles. Free to use as a guest or sign in to sync across devices.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · My Notes",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "notepad",
    "online notepad",
    "daily notes app",
    "time management app",
    "hourly log",
    "day planner",
    "weekly goals tracker",
    "script writing app",
    "writing desk",
    "journal app",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "My Notes",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
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
