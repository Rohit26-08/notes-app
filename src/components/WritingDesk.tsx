"use client";
import { useState, useEffect, useRef } from "react";

const EMOJIS = [
  "😊","😂","🥹","😍","🤔","😴","😤","🥳","😎","🤯",
  "💡","🔥","✅","❌","⚡","🎯","💬","📌","🚀","⭐",
  "🌿","☀️","🌙","❄️","🏃","🍕","☕","🎵","📚","💪",
  "🙏","❤️","💔","🧠","👀","💸","🏆","🎬","🎭","📝",
];

const TYPES = [
  { value: "script", label: "🎬 Script" },
  { value: "article", label: "📰 Article" },
  { value: "other", label: "📝 Other" },
];

type Draft = { id: string; title: string; type: string; content: string; updatedAt: string };

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function wc(t: string) { return t.trim() ? t.trim().split(/\s+/).length : 0; }

export default function WritingDesk() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const emojiRef = useRef<HTMLDivElement>(null);

  const selected = drafts.find((d) => d.id === selectedId) ?? null;

  useEffect(() => {
    fetch("/api/drafts")
      .then((r) => r.json())
      .then((data: Draft[]) => { setDrafts(data); setLoading(false); });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node))
        setShowEmoji(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function createDraft() {
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", type: "article", content: "" }),
    });
    const draft: Draft = await res.json();
    setDrafts((prev) => [draft, ...prev]);
    setSelectedId(draft.id);
  }

  function updateField(fields: Partial<Draft>) {
    if (!selected) return;
    setDrafts((prev) =>
      prev.map((d) => d.id === selected.id ? { ...d, ...fields, updatedAt: new Date().toISOString() } : d)
    );
    clearTimeout(saveTimer.current);
    setSaved(false);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/drafts/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const updated: Draft = await res.json();
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 700);
  }

  async function deleteDraft() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.title || "Untitled"}"?`)) return;
    await fetch(`/api/drafts/${selected.id}`, { method: "DELETE" });
    setDrafts((prev) => prev.filter((d) => d.id !== selected.id));
    setSelectedId(null);
  }

  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (!ta || !selected) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = selected.content.slice(0, s) + text + selected.content.slice(e);
    updateField({ content: next });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + text.length, s + text.length);
    }, 0);
  }

  const commonTools = ["H1", "H2", "H3", "—", "•", '"…"'];
  const scriptTools = ["INT.", "EXT.", "CUT TO:"];

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500">Loading…</div>;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col bg-[#1a1a24] border-r border-[#2e2e3e] p-3 gap-2">
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 px-1 pb-1 border-b border-[#2e2e3e]">
          Drafts
        </span>
        <button
          onClick={createDraft}
          className="text-sm py-2 rounded-lg border border-dashed border-[#2e2e3e] text-zinc-500 hover:border-violet-500 hover:text-violet-400 transition-all"
        >
          + New Draft
        </button>
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-1">
          {drafts.length === 0 && (
            <p className="text-xs text-zinc-600 px-2 pt-2">No drafts yet.</p>
          )}
          {drafts.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`text-left px-3 py-2 rounded-lg border transition-all ${
                d.id === selectedId
                  ? "bg-violet-500/10 border-violet-500/50"
                  : "border-transparent hover:bg-[#23232f]"
              }`}
            >
              <div className="text-xs font-semibold text-zinc-300 truncate">{d.title || "Untitled"}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(d.updatedAt)} · {wc(d.content)}w</div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                d.type === "script" ? "bg-yellow-500/15 text-yellow-400" :
                d.type === "article" ? "bg-emerald-500/15 text-emerald-400" :
                "bg-violet-500/15 text-violet-400"
              }`}>
                {TYPES.find((t) => t.value === d.type)?.label}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Editor */}
      <div className="flex-1 flex flex-col p-6 gap-3 overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-600">
            <span className="text-5xl">✍️</span>
            <p className="text-sm">Select a draft or start something new</p>
            <button
              onClick={createDraft}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm transition-all"
            >
              + New Draft
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                value={selected.title}
                onChange={(e) => updateField({ title: e.target.value })}
                placeholder="Title…"
                className="flex-1 min-w-0 bg-[#1a1a24] border border-[#2e2e3e] rounded-lg px-4 py-2 text-white text-lg font-bold outline-none focus:border-violet-500/60 placeholder-zinc-700 transition-colors"
              />
              <select
                value={selected.type}
                onChange={(e) => updateField({ type: e.target.value })}
                className="bg-[#1a1a24] border border-[#2e2e3e] rounded-lg px-3 py-2 text-zinc-400 text-sm outline-none focus:border-violet-500/60 cursor-pointer"
              >
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button
                onClick={deleteDraft}
                className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all"
              >
                🗑
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap items-center">
              {commonTools.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    const map: Record<string, string> = {
                      "H1": "\n# ", "H2": "\n## ", "H3": "\n### ",
                      "—": "\n---\n", "•": "\n• ", '"…"': `"…"`,
                    };
                    insertAtCursor(map[t] ?? t);
                  }}
                  className="px-3 py-1 text-xs rounded-md border border-[#2e2e3e] bg-[#1a1a24] text-zinc-400 hover:border-violet-500 hover:text-violet-300 transition-all"
                >
                  {t}
                </button>
              ))}
              {selected.type === "script" && scriptTools.map((t) => (
                <button
                  key={t}
                  onClick={() => insertAtCursor("\n" + t + " ")}
                  className="px-3 py-1 text-xs rounded-md border border-yellow-500/30 bg-[#1a1a24] text-yellow-400/70 hover:border-yellow-500 hover:text-yellow-300 transition-all"
                >
                  {t}
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
                      <button key={em} onClick={() => { insertAtCursor(em); setShowEmoji(false); }}
                        className="text-xl p-1 rounded-lg hover:bg-violet-500/20 transition-all">
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="ml-auto text-xs text-zinc-600">{wc(selected.content)} words</span>
              <span className="text-xs text-emerald-400 w-16 text-right">
                {saving ? "Saving…" : saved ? "✓ Saved" : ""}
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={selected.content}
              onChange={(e) => updateField({ content: e.target.value })}
              placeholder={
                selected.type === "script"
                  ? "INT. LOCATION - DAY\n\nCharacter walks in...\n\nCHARACTER\nDialogue goes here.\n\nCUT TO:"
                  : selected.type === "article"
                  ? "# Your article title\n\nStart writing your article here...\n\nUse the toolbar to add headings and formatting."
                  : "Start writing…"
              }
              className={`flex-1 bg-[#1a1a24] border border-[#2e2e3e] rounded-xl p-5 text-zinc-300 text-sm leading-8 resize-none outline-none focus:border-violet-500/60 placeholder-zinc-700 transition-colors ${
                selected.type === "script" ? "font-mono text-[13px]" : "font-serif"
              }`}
            />
          </>
        )}
      </div>
    </div>
  );
}
