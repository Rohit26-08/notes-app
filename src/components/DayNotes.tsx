"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const EMOJIS = [
  "😊","😂","🥹","😍","🤔","😴","😤","🥳","😎","🤯",
  "💡","🔥","✅","❌","⚡","🎯","💬","📌","🚀","⭐",
  "🌿","☀️","🌙","🌧️","❄️","🏃","🍕","☕","🎵","📚",
  "💪","🙏","👏","❤️","💔","🧠","👀","💸","🏆","🎬",
];

type DayNote = { id: string; date: string; content: string };

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

export default function DayNotes() {
  const [notes, setNotes] = useState<DayNote[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/day-notes")
      .then((r) => r.json())
      .then((data: DayNote[]) => {
        setNotes(data);
        const today = data.find((n) => n.date === todayStr());
        setContent(today?.content ?? "");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const note = notes.find((n) => n.date === selectedDate);
    setContent(note?.content ?? "");
  }, [selectedDate, notes]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node))
        setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveNote = useCallback((date: string, text: string) => {
    clearTimeout(saveTimer.current);
    setSaved(false);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      const res = await fetch("/api/day-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, content: text }),
      });
      const updated: DayNote = await res.json();
      setNotes((prev) => {
        const exists = prev.find((n) => n.date === date);
        return exists
          ? prev.map((n) => (n.date === date ? updated : n))
          : [updated, ...prev];
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 700);
  }, []);

  function onChange(val: string) {
    setContent(val);
    saveNote(selectedDate, val);
  }

  function addDay(date: string) {
    setSelectedDate(date);
    if (!notes.find((n) => n.date === date)) setContent("");
  }

  async function deleteDay() {
    if (!notes.find((n) => n.date === selectedDate)) return;
    if (!confirm(`Delete entry for ${formatDate(selectedDate)}?`)) return;
    await fetch(`/api/day-notes/${selectedDate}`, { method: "DELETE" });
    setNotes((prev) => prev.filter((n) => n.date !== selectedDate));
    setContent("");
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = content.slice(0, s) + text + content.slice(e);
    onChange(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + text.length, s + text.length);
    }, 0);
  }

  const sorted = [...notes].sort((a, b) => b.date.localeCompare(a.date));
  const today = todayStr();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 flex flex-col bg-[#1a1a24] border-r border-[#2e2e3e] p-3 gap-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 px-1 pb-1 border-b border-[#2e2e3e]">
          Days
        </span>
        <button
          onClick={() => addDay(today)}
          className="text-sm py-2 rounded-lg border border-dashed border-[#2e2e3e] text-zinc-500 hover:border-violet-500 hover:text-violet-400 transition-all"
        >
          + Today
        </button>
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-1">
          {sorted.map((n) => (
            <button
              key={n.date}
              onClick={() => setSelectedDate(n.date)}
              className={`text-left px-3 py-2 rounded-lg border transition-all ${
                n.date === selectedDate
                  ? "bg-violet-500/10 border-violet-500/50 text-violet-300"
                  : "border-transparent hover:bg-[#23232f] text-zinc-400"
              }`}
            >
              <div className="text-xs font-semibold truncate">
                {n.date === today ? "📅 Today" : new Date(n.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5 truncate">
                {n.content.trim().slice(0, 28) || "Empty"}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            const d = new Date();
            d.setDate(d.getDate() - (notes.length + 1));
            addDay(d.toISOString().split("T")[0]);
          }}
          className="text-xs py-1.5 rounded-lg border border-dashed border-[#2e2e3e] text-zinc-600 hover:border-zinc-500 hover:text-zinc-400 transition-all"
        >
          + Other day
        </button>
      </aside>

      {/* Editor */}
      <div className="flex-1 flex flex-col p-6 gap-3 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">{formatDate(selectedDate)}</h2>
          <div className="flex gap-1.5 flex-wrap items-center">
            {["H1 ", "H2 ", "H3 ", "— ", "• "].map((h) => (
              <button
                key={h}
                onClick={() => insertAtCursor("\n" + h)}
                className="px-3 py-1 text-xs rounded-md border border-[#2e2e3e] bg-[#1a1a24] text-zinc-400 hover:border-violet-500 hover:text-violet-300 transition-all"
              >
                {h.trim()}
              </button>
            ))}
            <div ref={emojiRef} className="relative">
              <button
                onClick={() => setShowEmoji((v) => !v)}
                className="px-2.5 py-1 text-base rounded-md border border-[#2e2e3e] bg-[#1a1a24] hover:border-violet-500 transition-all"
              >
                😊
              </button>
              {showEmoji && (
                <div className="absolute top-9 right-0 z-50 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl p-3 flex flex-wrap gap-1.5 w-64 shadow-2xl">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      onClick={() => { insertAtCursor(em); setShowEmoji(false); }}
                      className="text-xl p-1 rounded-lg hover:bg-violet-500/20 transition-all"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {notes.find((n) => n.date === selectedDate) && (
              <button
                onClick={deleteDay}
                className="px-3 py-1 text-xs rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
              >
                🗑 Delete
              </button>
            )}
            <span className="text-xs text-emerald-400 w-16 text-right">
              {saving ? "Saving…" : saved ? "✓ Saved" : ""}
            </span>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`What happened on ${formatDate(selectedDate)}?\n\nH1 Morning\n☕ Had a great coffee\n\nH2 Work\n💡 Had an idea...`}
          className="flex-1 bg-[#1a1a24] border border-[#2e2e3e] rounded-xl p-5 text-zinc-300 text-sm leading-7 resize-none outline-none focus:border-violet-500/60 placeholder-zinc-700 transition-colors font-mono"
        />
      </div>
    </div>
  );
}
