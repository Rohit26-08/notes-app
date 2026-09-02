"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import HourLogs from "@/components/HourLogs";

const EMOJIS = ["😊","😂","🥹","😍","🤔","😴","😤","🥳","😎","🤯","💡","🔥","✅","❌","⚡","🎯","💬","📌","🚀","⭐","🌿","☀️","🌙","🌧️","❄️","🏃","🍕","☕","🎵","📚","💪","🙏","👏","❤️","💔","🧠","👀","💸","🏆","🎬"];

type DayNote = { id: string; date: string; content: string };

function todayStr() { return new Date().toISOString().split("T")[0]; }
function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

export default function DayNotes() {
  const [notes, setNotes]               = useState<DayNote[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [dirty, setDirty]               = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [loading, setLoading]           = useState(true);
  const [showEmoji, setShowEmoji]       = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [showHourly, setShowHourly]     = useState(false);

  const emojiRef    = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dateRef     = useRef(selectedDate);
  dateRef.current   = selectedDate;

  // ── Tiptap editor ──────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: "What happened today? Click a heading button to start…",
        emptyEditorClass: "is-empty",
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-editor outline-none",
      },
    },
    onUpdate({ editor }) {
      setDirty(true); setSaved(false);
      const html = editor.getHTML();
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        persistNote(dateRef.current, html);
      }, 1000);
    },
  });

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/day-notes").then(r => r.json()).then((data: DayNote[]) => {
      setNotes(data);
      const today = data.find(n => n.date === todayStr());
      if (editor && today?.content) editor.commands.setContent(today.content);
      setLoading(false);
    });
  }, [editor]);

  // When date changes, load that day's content into editor
  useEffect(() => {
    if (!editor) return;
    const note = notes.find(n => n.date === selectedDate);
    editor.commands.setContent(note?.content || "");
    setDirty(false); setSaved(false);
  }, [selectedDate, editor]); // eslint-disable-line

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Persist ───────────────────────────────────────────────────────────────
  const persistNote = useCallback(async (date: string, html: string) => {
    setSaving(true);
    const res = await fetch("/api/day-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, content: html }),
    });
    const updated: DayNote = await res.json();
    setNotes(prev => {
      const exists = prev.some(n => n.date === date);
      return exists ? prev.map(n => n.date === date ? updated : n) : [updated, ...prev];
    });
    setSaving(false); setSaved(true); setDirty(false);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  function saveNow() {
    if (!editor) return;
    clearTimeout(debounceRef.current);
    persistNote(dateRef.current, editor.getHTML());
  }

  async function deleteDay() {
    if (!notes.find(n => n.date === selectedDate)) return;
    if (!confirm(`Delete entry for ${formatDate(selectedDate)}?`)) return;
    clearTimeout(debounceRef.current);
    await fetch(`/api/day-notes/${selectedDate}`, { method: "DELETE" });
    setNotes(prev => prev.filter(n => n.date !== selectedDate));
    editor?.commands.clearContent();
    setDirty(false);
  }

  function downloadNote() {
    const text = editor?.getText() ?? "";
    const blob = new Blob([`${formatDate(selectedDate)}\n\n${text}`], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `note-${selectedDate}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Toolbar actions ───────────────────────────────────────────────────────
  function cmd(action: () => void) {
    return (e: React.MouseEvent) => { e.preventDefault(); action(); editor?.commands.focus(); };
  }

  function isActive(type: string, attrs?: Record<string, unknown>) {
    return editor?.isActive(type, attrs) ?? false;
  }

  function btnClass(active: boolean) {
    return `px-2 sm:px-3 py-1 text-xs font-semibold rounded-md border transition-all select-none ${
      active
        ? "bg-violet-500/20 border-violet-500 text-violet-300"
        : "border-[#2e2e3e] bg-[#1a1a24] text-zinc-400 hover:border-violet-500 hover:text-violet-300 hover:bg-violet-500/10"
    }`;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const sorted  = [...notes].sort((a, b) => b.date.localeCompare(a.date));
  const today   = todayStr();
  const isSaved = notes.some(n => n.date === selectedDate);

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500">Loading…</div>;

  return (
    <div className="flex h-full relative">
      {/* Mobile sidebar toggle */}
      <button onClick={() => setSidebarOpen(v => !v)}
        className="sm:hidden fixed bottom-5 left-4 z-40 w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg text-lg">
        📅
      </button>
      {sidebarOpen && <div className="sm:hidden fixed inset-0 z-20 bg-black/60" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed sm:relative z-30 top-0 left-0 h-full w-56 sm:w-48 flex flex-col bg-[#1a1a24] border-r border-[#2e2e3e] p-3 gap-2 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Days</span>
          <button onClick={() => setSidebarOpen(false)} className="sm:hidden text-zinc-500 p-1">✕</button>
        </div>
        <button onClick={() => { setSelectedDate(today); setSidebarOpen(false); }}
          className="text-sm py-2 rounded-lg border border-dashed border-[#2e2e3e] text-zinc-500 hover:border-violet-500 hover:text-violet-400 transition-all">
          + Today
        </button>
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-1">
          {sorted.map(n => (
            <button key={n.date} onClick={() => { setSelectedDate(n.date); setSidebarOpen(false); }}
              className={`text-left px-3 py-2 rounded-lg border transition-all ${n.date === selectedDate ? "bg-violet-500/10 border-violet-500/50 text-violet-300" : "border-transparent hover:bg-[#23232f] text-zinc-400"}`}>
              <div className="text-xs font-semibold truncate">
                {n.date === today ? "📅 Today" : new Date(n.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5 truncate">
                {n.content.replace(/<[^>]+>/g, "").slice(0, 28) || "Empty"}
              </div>
            </button>
          ))}
          {sorted.length === 0 && <p className="text-xs text-zinc-600 px-2 pt-2">No entries yet.</p>}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 gap-3 overflow-hidden min-w-0">

        {/* Date */}
        <h2 className="text-base sm:text-xl font-bold text-white leading-tight shrink-0">
          {formatDate(selectedDate)}
        </h2>

        {/* Toolbar */}
        <div className="flex gap-1 flex-wrap items-center">
          {/* Headings */}
          <button title="Heading 1" onMouseDown={cmd(() => editor?.chain().toggleHeading({ level: 1 }).run())}
            className={btnClass(isActive("heading", { level: 1 }))}>H1</button>
          <button title="Heading 2" onMouseDown={cmd(() => editor?.chain().toggleHeading({ level: 2 }).run())}
            className={btnClass(isActive("heading", { level: 2 }))}>H2</button>
          <button title="Heading 3" onMouseDown={cmd(() => editor?.chain().toggleHeading({ level: 3 }).run())}
            className={btnClass(isActive("heading", { level: 3 }))}>H3</button>

          <div className="w-px h-4 bg-[#2e2e3e] mx-0.5" />

          {/* Text formatting */}
          <button title="Bold (Ctrl+B)" onMouseDown={cmd(() => editor?.chain().toggleBold().run())}
            className={btnClass(isActive("bold"))}>
            <strong className="font-bold">B</strong>
          </button>
          <button title="Italic (Ctrl+I)" onMouseDown={cmd(() => editor?.chain().toggleItalic().run())}
            className={btnClass(isActive("italic"))}>
            <em>I</em>
          </button>

          <div className="w-px h-4 bg-[#2e2e3e] mx-0.5" />

          {/* Lists */}
          <button title="Bullet list" onMouseDown={cmd(() => editor?.chain().toggleBulletList().run())}
            className={btnClass(isActive("bulletList"))}>• List</button>
          <button title="Numbered list" onMouseDown={cmd(() => editor?.chain().toggleOrderedList().run())}
            className={btnClass(isActive("orderedList"))}>1. List</button>

          <div className="w-px h-4 bg-[#2e2e3e] mx-0.5" />

          {/* Block */}
          <button title="Blockquote" onMouseDown={cmd(() => editor?.chain().toggleBlockquote().run())}
            className={btnClass(isActive("blockquote"))}>❝</button>
          <button title="Divider" onMouseDown={cmd(() => editor?.chain().setHorizontalRule().run())}
            className={btnClass(false)}>—</button>

          {/* Emoji picker */}
          <div ref={emojiRef} className="relative ml-1">
            <button onMouseDown={e => { e.preventDefault(); setShowEmoji(v => !v); }}
              title="Insert emoji"
              className="px-2 py-1 text-base rounded-md border border-[#2e2e3e] bg-[#1a1a24] hover:border-violet-500 transition-all">
              😊
            </button>
            {showEmoji && (
              <div className="absolute top-9 right-0 z-50 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl p-3 flex flex-wrap gap-1.5 w-64 shadow-2xl">
                {EMOJIS.map(em => (
                  <button key={em}
                    onMouseDown={e => {
                      e.preventDefault();
                      editor?.chain().focus().insertContent(em).run();
                      setShowEmoji(false);
                    }}
                    className="text-xl p-1 rounded-lg hover:bg-violet-500/20 transition-all">
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete entry */}
          {isSaved && (
            <button onClick={deleteDay} title="Delete this entry"
              className="px-2 sm:px-3 py-1 text-xs rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all ml-auto">
              🗑 Delete
            </button>
          )}
        </div>

        {/* Rich editor */}
        <div className="flex-1 bg-[#1a1a24] border border-[#2e2e3e] rounded-xl overflow-y-auto focus-within:border-violet-500/60 transition-colors min-h-[200px]">
          <EditorContent editor={editor} className="h-full" />
        </div>

        {/* Save bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={saveNow}
            className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              saving ? "bg-violet-600/50 text-white cursor-wait"
              : dirty ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
              : "bg-[#1a1a24] border border-[#2e2e3e] text-zinc-500"
            }`}>
            {saving
              ? <><span className="w-3.5 h-3.5 border border-white/50 border-t-white rounded-full animate-spin inline-block" /> Saving…</>
              : saved ? "✓ Saved" : dirty ? "💾 Save now" : "Saved"}
          </button>
          <button onClick={downloadNote}
            className="px-4 py-2 rounded-lg text-sm border border-[#2e2e3e] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all">
            ⬇ Download
          </button>
          {saving && <span className="text-xs text-zinc-500">Auto-saving…</span>}
          {saved && !dirty && <span className="text-xs text-emerald-400">All changes saved</span>}
          {dirty && !saving && <span className="text-xs text-amber-400">Unsaved · auto-saves in 1s</span>}
        </div>

        {/* Hourly log */}
        <div className="shrink-0 border-t border-[#2e2e3e] pt-3 -mx-4 sm:-mx-6 px-4 sm:px-6 max-h-[40%] overflow-y-auto scrollbar-thin">
          <button
            onClick={() => setShowHourly(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
          >
            <span className={`transition-transform ${showHourly ? "rotate-90" : ""}`}>▶</span>
            🕐 Hourly log
          </button>
          {showHourly && <HourLogs date={selectedDate} />}
        </div>
      </div>
    </div>
  );
}
