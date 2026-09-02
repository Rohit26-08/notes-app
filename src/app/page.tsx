"use client";
import { useState } from "react";
import { useAuth, UserButton } from "@clerk/nextjs";
import DayNotes from "@/components/DayNotes";
import WritingDesk from "@/components/WritingDesk";
import WeeklyGoals from "@/components/WeeklyGoals";
import LandingPage from "@/components/LandingPage";
import Link from "next/link";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const [tab, setTab] = useState<"day" | "write" | "goals">("day");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#1a1a24] border-b border-[#2e2e3e] shrink-0 gap-3">
        <span className="text-base sm:text-lg font-bold text-white tracking-tight whitespace-nowrap">📓 My Notes</span>

        <nav className="flex gap-1.5 sm:gap-2 flex-1 justify-center">
          {(["day", "write", "goals"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all ${
                tab === t
                  ? "bg-violet-500/20 border-violet-500 text-violet-300"
                  : "border-[#2e2e3e] text-zinc-500 hover:text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {t === "day" ? "📅 Day Log" : t === "write" ? "✍️ Writing" : "🎯 Weekly Goals"}
            </button>
          ))}
        </nav>

        <UserButton />
      </header>

      <main className="flex-1 overflow-hidden">
        {tab === "day" ? <DayNotes /> : tab === "write" ? <WritingDesk /> : <WeeklyGoals />}
      </main>
    </div>
  );
}
