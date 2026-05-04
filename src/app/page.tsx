"use client";
import { useState } from "react";
import DayNotes from "@/components/DayNotes";
import WritingDesk from "@/components/WritingDesk";

export default function Home() {
  const [tab, setTab] = useState<"day" | "write">("day");

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 bg-[#1a1a24] border-b border-[#2e2e3e] shrink-0">
        <span className="text-lg font-bold text-white tracking-tight">📓 My Notes</span>
        <nav className="flex gap-2">
          {(["day", "write"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                tab === t
                  ? "bg-violet-500/20 border-violet-500 text-violet-300"
                  : "border-[#2e2e3e] text-zinc-500 hover:text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {t === "day" ? "📅 Day Log" : "✍️ Writing Desk"}
            </button>
          ))}
        </nav>
      </header>
      <main className="flex-1 overflow-hidden">
        {tab === "day" ? <DayNotes /> : <WritingDesk />}
      </main>
    </div>
  );
}
