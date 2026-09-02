"use client";
import { useState } from "react";
import Link from "next/link";
import GuestEditor from "./GuestEditor";

export default function LandingPage() {
  const [mode, setMode] = useState<"home" | "guest">("home");

  if (mode === "guest") return <GuestEditor />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f13] px-4 text-center">
      <div className="max-w-md w-full">
        <div className="text-6xl mb-4">📓</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">My Notes</h1>
        <p className="text-zinc-400 text-base sm:text-lg mb-8 leading-relaxed">
          Your personal space to log your days and write scripts or articles.
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
    </div>
  );
}
