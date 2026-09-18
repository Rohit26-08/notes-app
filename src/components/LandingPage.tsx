"use client";
import { useState } from "react";
import Link from "next/link";
import GuestEditor from "./GuestEditor";

export default function LandingPage() {
  const [mode, setMode] = useState<"home" | "guest">("home");

  if (mode === "guest") return <GuestEditor />;

  const features = [
    {
      icon: "📅",
      title: "Daily notepad & journal",
      body: "Write a note for every day, organized by date so you always know what happened when.",
    },
    {
      icon: "🕐",
      title: "Hour-by-hour time management",
      body: "Break your day into an hourly log to see exactly where your time went and plan better tomorrow.",
    },
    {
      icon: "🎯",
      title: "Weekly goals tracker",
      body: "Set goals for the week and check them off day by day, with a progress chart to keep you honest.",
    },
    {
      icon: "✍️",
      title: "Script & article writing desk",
      body: "A distraction-free rich text editor for writing scripts, articles, or anything longer than a note.",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col items-center bg-[#0f0f13] px-4 py-12 text-center">
      <div className="max-w-md w-full">
        <div className="text-6xl mb-4">📓</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">My Notes</h1>
        <p className="text-zinc-400 text-base sm:text-lg mb-8 leading-relaxed">
          A simple online notepad for daily journaling, time management, weekly goals, and script writing.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/sign-in"
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base transition-all"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="w-full py-3 rounded-xl bg-[#1a1a24] border border-[#2e2e3e] hover:border-violet-500 text-zinc-300 font-semibold text-base transition-all"
          >
            Create account
          </Link>
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2e2e3e]" />
            </div>
            <span className="relative bg-[#0f0f13] px-3 text-xs text-zinc-600">or</span>
          </div>
          <button
            onClick={() => setMode("guest")}
            className="w-full py-3 rounded-xl border border-dashed border-[#2e2e3e] text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 text-sm transition-all"
          >
            Continue as guest <span className="text-zinc-600">— saved locally</span>
          </button>
        </div>

        <p className="mt-6 text-xs text-zinc-600">
          Guest mode stores notes in your browser. Sign in to sync to the cloud.
        </p>
      </div>

      <section className="max-w-3xl w-full mt-16 text-left">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
          A notepad built for time management and writing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-[#1a1a24] border border-[#2e2e3e] rounded-xl p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">{f.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
