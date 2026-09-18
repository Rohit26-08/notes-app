"use client";
import { useState } from "react";
import type { Editor } from "@tiptap/react";

async function callAssist(action: "grammar" | "suggest", text: string): Promise<string> {
  const res = await fetch("/api/assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "AI assist failed");
  }
  const data = await res.json();
  return data.result as string;
}

export default function AiAssistBar({ editor }: { editor: Editor | null }) {
  const [loading, setLoading] = useState<"grammar" | "suggest" | null>(null);
  const [error, setError] = useState("");
  const [correction, setCorrection] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  async function checkGrammar() {
    if (!editor) return;
    const text = editor.getText().trim();
    if (!text) return;
    setError(""); setSuggestion(null); setLoading("grammar");
    try {
      const result = await callAssist("grammar", text);
      setCorrection(result || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function suggestNext() {
    if (!editor) return;
    const text = editor.getText().trim();
    if (!text) return;
    setError(""); setCorrection(null); setLoading("suggest");
    try {
      const result = await callAssist("suggest", text.slice(-800));
      setSuggestion(result || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  function applyCorrection() {
    if (!editor || !correction) return;
    editor.chain().focus().selectAll().deleteSelection().insertContent(correction).run();
    setCorrection(null);
  }

  function applySuggestion() {
    if (!editor || !suggestion) return;
    editor.chain().focus().insertContent(" " + suggestion).run();
    setSuggestion(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 items-center">
        <button
          onMouseDown={e => { e.preventDefault(); checkGrammar(); }}
          disabled={loading !== null}
          title="Check grammar & spelling"
          className="px-2 sm:px-3 py-1 text-xs font-semibold rounded-md border border-emerald-500/30 bg-[#1a1a24] text-emerald-400/90 hover:border-emerald-500 hover:text-emerald-300 disabled:opacity-50 transition-all select-none"
        >
          {loading === "grammar" ? "Checking…" : "✅ Grammar"}
        </button>
        <button
          onMouseDown={e => { e.preventDefault(); suggestNext(); }}
          disabled={loading !== null}
          title="Suggest next words"
          className="px-2 sm:px-3 py-1 text-xs font-semibold rounded-md border border-sky-500/30 bg-[#1a1a24] text-sky-400/90 hover:border-sky-500 hover:text-sky-300 disabled:opacity-50 transition-all select-none"
        >
          {loading === "suggest" ? "Thinking…" : "💡 Suggest"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {correction && (
        <div className="bg-[#1a1a24] border border-emerald-500/30 rounded-lg p-3 flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-emerald-400/80">Suggested correction</p>
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{correction}</p>
          <div className="flex gap-2">
            <button onClick={applyCorrection} className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-all">
              Apply
            </button>
            <button onClick={() => setCorrection(null)} className="px-3 py-1 text-xs rounded-md border border-[#2e2e3e] text-zinc-500 hover:text-zinc-300 transition-all">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {suggestion && (
        <div className="bg-[#1a1a24] border border-sky-500/30 rounded-lg p-3 flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest text-sky-400/80">Suggested continuation</p>
          <p className="text-sm text-zinc-300">…{suggestion}</p>
          <div className="flex gap-2">
            <button onClick={applySuggestion} className="px-3 py-1 text-xs font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white transition-all">
              Insert
            </button>
            <button onClick={() => setSuggestion(null)} className="px-3 py-1 text-xs rounded-md border border-[#2e2e3e] text-zinc-500 hover:text-zinc-300 transition-all">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
