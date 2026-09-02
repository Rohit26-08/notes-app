"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const EMOJIS = ["😊","😂","🥹","😍","🤔","😴","😤","🥳","😎","🤯","💡","🔥","✅","❌","⚡","🎯","💬","📌","🚀","⭐","🌿","☀️","🌙","❄️","🏃","🍕","☕","🎵","📚","💪","🙏","❤️","💔","🧠","👀","💸","🏆","🎬","🎭","📝"];
const TYPES  = [
  { value: "script",  label: "🎬 Script"  },
  { value: "article", label: "📰 Article" },
  { value: "other",   label: "📝 Other"   },
];

type Draft = { id: string; title: string; type: string; content: string; updatedAt: string };

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60)    return "Just now";
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function wordCount(html: string) {
  const text = html.replace(/<[^>]+>/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
}

export default function WritingDesk() {
  const [drafts, setDrafts]           = useState<Draft[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [selected, setSelected]       = useState<Draft | null>(null);
  const [dirty, setDirty]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [loading, setLoading]         = useState(true);
  const [showEmoji, setShowEmoji]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const emojiRef     = useRef<HTMLDivElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout>>(undefined);
  const selectedRef  = useRef<Draft | null>(null);
  selectedRef.current = selected;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({
        placeholder: "Start writing your draft… Use the toolbar to format.",
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
      const html = editor.getHTML();
      setSelected(prev => {
        if (!prev) return prev;
        const next = { ...prev, content: html };
        selectedRef.current = next;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          if (selectedRef.current) persistDraft(selectedRef.current);
        }, 1000);
        return next;
      });
      setDirty(true); setSaved(false);
    },
  });

  useEffect(() => {
    fetch("/api/drafts").then(r => r.json()).then((data: Draft[]) => {
      setDrafts(data); setLoading(false);
    });
  }, []);

  useEffect(() => {
    const d = drafts.find(d => d.id === selectedId) ?? null;
    setSelected(d);
    setDirty(false); setSaved(false);
    if (editor) editor.commands.setContent(d?.content || "");
  }, [selectedId, editor]); // eslint-disable-line

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const persistDraft = useCallback(async (draft: Draft) => {
    setSaving(true);
    const res = await fetch(`/api/drafts/${draft.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: draft.title, type: draft.type, content: draft.content }),
    });
    const updated: Draft = await res.json();
    setDrafts(prev => prev.map(d => d.id === updated.id ? updated : d));
    setSaving(false); setSaved(true); setDirty(false);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  function updateMeta(fields: Partial<Draft>) {
    setSelected(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...fields };
      selectedRef.current = next;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (selectedRef.current) persistDraft(selectedRef.current);
      }, 1000);
      return next;
    });
    setDirty(true); setSaved(false);
  }

  function saveNow() {
    clearTimeout(debounceRef.current);
    if (selectedRef.current) persistDraft(selectedRef.current);
  }

  async function createDraft() {
    const res = await fetch("/api/drafts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", type: "article", content: "" }),
    });
    const draft: Draft = await res.json();
    setDrafts(prev => [draft, ...prev]);
    setSelectedId(draft.id); setSidebarOpen(false);
  }

  async function deleteDraft() {
    if (!selected) return;
    if (!confirm(`Delete "${selected.title || "Untitled"}"?`)) return;
    clearTimeout(debounceRef.current);
    await fetch(`/api/drafts/${selected.id}`, { method: "DELETE" });
    setDrafts(prev => prev.filter(d => d.id !== selected.id));
    setSelectedId(null); editor?.commands.clearContent();
  }

  function downloadDraft() {
    if (!selected) return;
    const text = editor?.getText() ?? "";
    const blob = new Blob([`${selected.title || "Untitled"}\n\n${text}`], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${(selected.title || "draft").replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  }

  // Toolbar helpers
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

  if (loading) return <div className="flex items-center justify-center h-full text-zinc-500">Loading…</div>;

  return (
    <div className="flex h-full relative">
      <button onClick={() => setSidebarOpen(v => !v)}
        className="sm:hidden fixed bottom-5 left-4 z-40 w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg text-lg">
        ✍️
      </button>
      {sidebarOpen && <div className="sm:hidden fixed inset-0 z-20 bg-black/60" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed sm:relative z-30 top-0 left-0 h-full w-56 sm:w-52 flex flex-col bg-[#1a1a24] border-r border-[#2e2e3e] p-3 gap-2 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-zinc-600">Drafts</span>
          <button onClick={() => setSidebarOpen(false)} className="sm:hidden text-zinc-500 p-1">✕</button>
        </div>
        <button onClick={createDraft}
          className="text-sm py-2 rounded-lg border border-dashed border-[#2e2e3e] text-zinc-500 hover:border-violet-500 hover:text-violet-400 transition-all">
          + New Draft
        </button>
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-1">
          {drafts.length === 0 && <p className="text-xs text-zinc-600 px-2 pt-2">No drafts yet.</p>}
          {drafts.map(d => (
            <button key={d.id} onClick={() => { setSelectedId(d.id); setSidebarOpen(false); }}
              className={`text-left px-3 py-2 rounded-lg border transition-all ${d.id === selectedId ? "bg-violet-500/10 border-violet-500/50" : "border-transparent hover:bg-[#23232f]"}`}>
              <div className="text-xs font-semibold text-zinc-300 truncate">{d.title || "Untitled"}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{timeAgo(d.updatedAt)} · {wordCount(d.content)}w</div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                d.type === "script" ? "bg-yellow-500/15 text-yellow-400" :
                d.type === "article" ? "bg-emerald-500/15 text-emerald-400" :
                "bg-violet-500/15 text-violet-400"
              }`}>{TYPES.find(t => t.value === d.type)?.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Editor */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 gap-3 overflow-hidden min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-600">
            <span className="text-5xl">✍️</span>
            <p className="text-sm">Select a draft or create a new one</p>
            <button onClick={createDraft}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all">
              + New Draft
            </button>
          </div>
        ) : (
          <>
            {/* Title + type + delete */}
            <div className="flex gap-2 items-center flex-wrap">
              <input value={selected.title} onChange={e => updateMeta({ title: e.target.value })}
                placeholder="Title…"
                className="flex-1 min-w-0 bg-[#1a1a24] border border-[#2e2e3e] rounded-lg px-4 py-2 text-white text-base sm:text-lg font-bold outline-none focus:border-violet-500/60 placeholder-zinc-700 transition-colors" />
              <select value={selected.type} onChange={e => updateMeta({ type: e.target.value })}
                className="bg-[#1a1a24] border border-[#2e2e3e] rounded-lg px-3 py-2 text-zinc-400 text-sm outline-none focus:border-violet-500/60 cursor-pointer">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button onClick={deleteDraft}
                className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all">🗑</button>
            </div>

            {/* Toolbar */}
            <div className="flex gap-1 flex-wrap items-center">
              <button title="Heading 1" onMouseDown={cmd(() => editor?.chain().toggleHeading({ level: 1 }).run())}
                className={btnClass(isActive("heading", { level: 1 }))}>H1</button>
              <button title="Heading 2" onMouseDown={cmd(() => editor?.chain().toggleHeading({ level: 2 }).run())}
                className={btnClass(isActive("heading", { level: 2 }))}>H2</button>
              <button title="Heading 3" onMouseDown={cmd(() => editor?.chain().toggleHeading({ level: 3 }).run())}
                className={btnClass(isActive("heading", { level: 3 }))}>H3</button>

              <div className="w-px h-4 bg-[#2e2e3e] mx-0.5" />

              <button title="Bold (Ctrl+B)" onMouseDown={cmd(() => editor?.chain().toggleBold().run())}
                className={btnClass(isActive("bold"))}><strong>B</strong></button>
              <button title="Italic (Ctrl+I)" onMouseDown={cmd(() => editor?.chain().toggleItalic().run())}
                className={btnClass(isActive("italic"))}><em>I</em></button>

              <div className="w-px h-4 bg-[#2e2e3e] mx-0.5" />

              <button title="Bullet list" onMouseDown={cmd(() => editor?.chain().toggleBulletList().run())}
                className={btnClass(isActive("bulletList"))}>• List</button>
              <button title="Numbered list" onMouseDown={cmd(() => editor?.chain().toggleOrderedList().run())}
                className={btnClass(isActive("orderedList"))}>1. List</button>

              <div className="w-px h-4 bg-[#2e2e3e] mx-0.5" />

              <button title="Blockquote" onMouseDown={cmd(() => editor?.chain().toggleBlockquote().run())}
                className={btnClass(isActive("blockquote"))}>❝</button>
              <button title="Divider" onMouseDown={cmd(() => editor?.chain().setHorizontalRule().run())}
                className={btnClass(false)}>—</button>

              {/* Script tools */}
              {selected.type === "script" && <>
                <div className="w-px h-4 bg-[#2e2e3e] mx-0.5" />
                {["INT.", "EXT.", "CUT TO:"].map(t => (
                  <button key={t} onMouseDown={cmd(() => editor?.chain().insertContent(`\n${t} `).run())}
                    className="px-2 sm:px-3 py-1 text-xs font-semibold rounded-md border border-yellow-500/30 bg-[#1a1a24] text-yellow-400/80 hover:border-yellow-500 hover:text-yellow-300 transition-all select-none">
                    {t}
                  </button>
                ))}
              </>}

              {/* Emoji */}
              <div ref={emojiRef} className="relative ml-1">
                <button onMouseDown={e => { e.preventDefault(); setShowEmoji(v => !v); }}
                  className="px-2 py-1 text-base rounded-md border border-[#2e2e3e] bg-[#1a1a24] hover:border-violet-500 transition-all">
                  😊
                </button>
                {showEmoji && (
                  <div className="absolute top-9 right-0 z-50 bg-[#1e1e2e] border border-[#2e2e3e] rounded-xl p-3 flex flex-wrap gap-1.5 w-64 shadow-2xl">
                    {EMOJIS.map(em => (
                      <button key={em} onMouseDown={e => { e.preventDefault(); editor?.chain().focus().insertContent(em).run(); setShowEmoji(false); }}
                        className="text-xl p-1 rounded-lg hover:bg-violet-500/20 transition-all">{em}</button>
                    ))}
                  </div>
                )}</div>

              <span className="ml-auto text-xs text-zinc-600 hidden sm:block">{wordCount(selected.content)} words</span>
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
              <button onClick={downloadDraft}
                className="px-4 py-2 rounded-lg text-sm border border-[#2e2e3e] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all">
                ⬇ Download
              </button>
              <span className="text-xs text-zinc-600 sm:hidden">{wordCount(selected.content)}w</span>
              {saving && <span className="text-xs text-zinc-500">Auto-saving…</span>}
              {saved && !dirty && <span className="text-xs text-emerald-400">All saved</span>}
              {dirty && !saving && <span className="text-xs text-amber-400 hidden sm:block">Unsaved · auto-saves in 1s</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
