"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const EMOJIS = ["😊","😂","🥹","😍","🤔","😴","😤","🥳","😎","🤯","💡","🔥","✅","❌","⚡","🎯","💬","📌","🚀","⭐","🌿","☀️","🌙","🌧️","❄️","🏃","🍕","☕","🎵","📚","💪","🙏","❤️","💔","🧠","👀","💸","🏆","🎬","📝"];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function GuestEditor() {
  const [tab, setTab] = useState<"day" | "write">("day");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem("guest_day_notes") || "{}"); } catch { return {}; }
  });
  const [content, setContent] = useState(() => {
    try { const n = JSON.parse(localStorage.getItem("guest_day_notes") || "{}"); return n[todayStr()] || ""; } catch { return ""; }
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContent(notes[selectedDate] || "");
    setDirty(false);
  }, [selectedDate]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Save to localStorage when leaving page
  useEffect(() => {
    const handler = () => {
      if (dirty) {
        const updated = { ...notes, [selectedDate]: content };
        localStorage.setItem("guest_day_notes", JSON.stringify(updated));
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, notes, selectedDate, content]);

  function saveLocally() {
    const updated = { ...notes, [selectedDate]: content };
    setNotes(updated);
    localStorage.setItem("guest_day_notes", JSON.stringify(updated));
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function downloadNote() {
    const text = content || "(empty)";
    const blob = new Blob([`# ${formatDate(selectedDate)}\n\n${text}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `note-${selectedDate}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = content.slice(0, s) + text + content.slice(e);
    setContent(next);
    setDirty(true);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + text.length, s + text.length); }, 0);
  }

  const sortedDays = Object.keys(notes).sort((a, b) => b.localeCompare(a));
  if (!sortedDays.includes(todayStr())) sortedDays.unshift(todayStr());

  return (
    <div className="flex flex-col h-screen">
      {/* Top banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs text-amber-400 flex items-center justify-center gap-3 flex-wrap">
        <span>👋 Guest mode — notes saved locally in your browser</span>
        <Link href="/sign-in" className="underline font-semibold hover:text-amber-300">Sign in to sync to cloud →</Link>
      </div>

      <header className="flex items-center justify-between px-4 py-2.5 bg-[#1a1a24] border-b border-[#2e2e3e] gap-3">
        <span className="text-base font-bold text-white">📓 My Notes</span>
        <nav className="flex gap-1.5">
          {(["day", "write"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${tab === t ? "bg-violet-500/20 border-violet-500 text-violet-300" : "border-[#2e2e3e] text-zinc-500"}`}>
              {t === "day" ? "📅 Day Log" : "✍️ Writing"}
            </button>
          ))}
        </nav>
        <Link href="/sign-in" className="text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all whitespace-nowrap">Sign in</Link>
      </header>

      <main className="flex-1 overflow-hidden">
        {tab === "day" ? (
          <div className="flex h-full">
            {/* Mobile sidebar toggle */}
            <button onClick={() => setSidebarOpen(v => !v)}
              className="sm:hidden fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg">
              ☰
            </button>

            {/* Sidebar */}
            <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 fixed sm:relative z-30 top-0 left-0 h-full w-56 sm:w-48 flex flex-col bg-[#1a1a24] border-r border-[#2e2e3e] p-3 gap-2 transition-transform duration-200`}>
              <div className="flex items-center justify-between sm:hidden">
                <span className="text-[10px] uppercase tracking-widest text-zinc-600">Days</span>
                <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 text-lg">✕</button>
              </div>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest text-zinc-600 px-1 pb-1 border-b border-[#2e2e3e]">Days</span>
              <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-1">
                {sortedDays.map((d) => (
                  <button key={d} onClick={() => { setSelectedDate(d); setSidebarOpen(false); }}
                    className={`text-left px-3 py-2 rounded-lg border transition-all ${d === selectedDate ? "bg-violet-500/10 border-violet-500/50 text-violet-300" : "border-transparent hover:bg-[#23232f] text-zinc-400"}`}>
                    <div className="text-xs font-semibold truncate">
                      {d === todayStr() ? "📅 Today" : new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                    <div className="text-[10px] text-zinc-600 mt-0.5 truncate">{(notes[d] || "").slice(0, 28) || "Empty"}</div>
                  </button>
                ))}
              </div>
            </aside>

            {sidebarOpen && <div className="sm:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setSidebarOpen(false)} />}

            {/* Editor */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 gap-3 overflow-hidden min-w-0">
              <div className="flex items-start sm:items-center justify-between flex-wrap gap-2">
                <h2 className="text-base sm:text-xl font-bold text-white">{formatDate(selectedDate)}</h2>
                <div className="flex gap-1.5 flex-wrap items-center">
                  {["H1 ", "H2 ", "H3 ", "— ", "• "].map((h) => (
                    <button key={h} onClick={() => insertAtCursor("\n" + h)}
                      className="px-2 sm:px-3 py-1 text-xs rounded-md border border-[#2e2e3e] bg-[#1a1a24] text-zinc-400 hover:border-violet-500 hover:text-violet-300 transition-all">
                      {h.trim()}
                    </button>
                  ))}
                  <div ref={emojiRef} className="relative">
                    <button onClick={() => setShowEmoji(v => !v)}
                      className="px-2 py-1 text-base rounded-md border border-[#2e2e3e] bg-[#1a1a24] hover:border-violet-500 transition-all">😊</button>
                    {showEmoji && (
                      <div className="absolute top-9 right-0 z-50 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl p-3 flex flex-wrap gap-1.5 w-64 shadow-2xl">
                        {EMOJIS.map(em => (
                          <button key={em} onClick={() => { insertAtCursor(em); setShowEmoji(false); }}
                            className="text-xl p-1 rounded-lg hover:bg-violet-500/20 transition-all">{em}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <textarea ref={textareaRef} value={content}
                onChange={e => { setContent(e.target.value); setDirty(true); }}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveLocally(); } }}
                placeholder={`What happened on ${formatDate(selectedDate)}?\n\nH1 Morning\n☕ Had a great coffee\n\nH2 Work\n💡 Had an idea...`}
                className="flex-1 bg-[#1a1a24] border border-[#2e2e3e] rounded-xl p-4 sm:p-5 text-zinc-300 text-sm leading-7 resize-none outline-none focus:border-violet-500/60 placeholder-zinc-700 transition-colors font-mono min-h-[200px]" />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-2">
                  <button onClick={saveLocally}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${dirty ? "bg-violet-600 hover:bg-violet-500 text-white" : "bg-[#1a1a24] border border-[#2e2e3e] text-zinc-500"}`}>
                    {saved ? "✓ Saved locally" : dirty ? "💾 Save" : "Saved"}
                  </button>
                  <button onClick={downloadNote}
                    className="px-4 py-2 rounded-lg text-sm border border-[#2e2e3e] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all">
                    ⬇ Download
                  </button>
                </div>
                {dirty && <span className="text-xs text-amber-400">Unsaved changes</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full flex-col gap-4 text-zinc-500 p-6 text-center">
            <span className="text-4xl">✍️</span>
            <p className="text-sm">Writing Desk is available for signed-in users.</p>
            <Link href="/sign-up" className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all">Create free account →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
