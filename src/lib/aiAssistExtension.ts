import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type GrammarIssue = { from: number; to: number; suggestion: string };

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    aiAssist: {
      setGhostSuggestion: (text: string | null) => ReturnType;
      clearGhostSuggestion: () => ReturnType;
      setGrammarIssues: (issues: GrammarIssue[]) => ReturnType;
    };
  }
}

const ghostKey = new PluginKey("aiGhostSuggestion");
const grammarKey = new PluginKey("aiGrammarIssues");

const SUGGEST_DELAY = 1400;
const GRAMMAR_DELAY = 2200;

async function callAssist(action: "grammar" | "suggest", text: string): Promise<string> {
  try {
    const res = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, text }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return (data.result as string) || "";
  } catch {
    return "";
  }
}

/** Word-level diff: returns issues as {from, to, suggestion} char offsets into `original`. */
function diffWords(original: string, corrected: string) {
  const origTokens = original.split(/(\s+)/).filter(t => t.length > 0);
  const corrTokens = corrected.split(/(\s+)/).filter(t => t.length > 0);
  const offsets: number[] = [];
  { let o = 0; for (const t of origTokens) { offsets.push(o); o += t.length; } }
  const isWord = (t: string) => !/^\s+$/.test(t);

  const n = origTokens.length, m = corrTokens.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = origTokens[i] === corrTokens[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const issues: { from: number; length: number; suggestion: string }[] = [];
  let i = 0, j = 0, runStartI = -1, runStartJ = -1;

  function flush(endI: number, endJ: number) {
    if (runStartI === -1) return;
    if (endI > runStartI && isWord(origTokens[runStartI])) {
      const from = offsets[runStartI];
      const lastIdx = endI - 1;
      const length = offsets[lastIdx] + origTokens[lastIdx].length - from;
      const origSpan = origTokens.slice(runStartI, endI).join("");
      const suggestion = corrTokens.slice(runStartJ, endJ).join("");
      if (suggestion.trim() && suggestion !== origSpan) {
        issues.push({ from, length, suggestion });
      }
    }
    runStartI = -1; runStartJ = -1;
  }

  while (i < n && j < m) {
    if (origTokens[i] === corrTokens[j]) {
      flush(i, j);
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      if (runStartI === -1) { runStartI = i; runStartJ = j; }
      i++;
    } else {
      if (runStartI === -1) { runStartI = i; runStartJ = j; }
      j++;
    }
  }
  flush(i, j);
  return issues.slice(0, 25);
}

/** Maps character offsets in editor.getText({blockSeparator}) back to real doc positions. */
function buildPosMap(doc: import("@tiptap/pm/model").Node, separator: string): number[] {
  const map: number[] = [];
  let seenBlock = false;
  doc.descendants((node, pos) => {
    if (node.isTextblock) {
      if (seenBlock) for (const _ch of separator) map.push(-1);
      seenBlock = true;
    }
    if (node.isText && node.text) {
      for (let k = 0; k < node.text.length; k++) map.push(pos + k);
    }
    return true;
  });
  return map;
}

export const AiAssist = Extension.create({
  name: "aiAssist",

  addStorage() {
    return {
      ghost: null as string | null,
      loading: false as boolean,
    };
  },

  addCommands() {
    return {
      setGhostSuggestion:
        (text: string | null) =>
        ({ tr, dispatch }) => {
          this.storage.ghost = text;
          if (dispatch) {
            tr.setMeta(ghostKey, { text, pos: tr.selection.to });
            dispatch(tr);
          }
          return true;
        },
      clearGhostSuggestion:
        () =>
        ({ tr, dispatch }) => {
          this.storage.ghost = null;
          if (dispatch) {
            tr.setMeta(ghostKey, { text: null });
            dispatch(tr);
          }
          return true;
        },
      setGrammarIssues:
        (issues: GrammarIssue[]) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(grammarKey, issues);
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const ghost = this.storage.ghost;
        if (!ghost) return false;
        this.editor.chain().insertContent(ghost).run();
        this.editor.commands.clearGhostSuggestion();
        return true;
      },
      Escape: () => {
        if (!this.storage.ghost) return false;
        this.editor.commands.clearGhostSuggestion();
        return true;
      },
    };
  },

  onUpdate() {
    const editor = this.editor;
    if (this.storage.ghost) editor.commands.clearGhostSuggestion();

    clearTimeout((this.storage as { ghostTimer?: ReturnType<typeof setTimeout> }).ghostTimer);
    clearTimeout((this.storage as { grammarTimer?: ReturnType<typeof setTimeout> }).grammarTimer);

    const text = editor.getText().trim();
    if (!text) {
      editor.commands.setGrammarIssues([]);
      return;
    }

    (this.storage as { ghostTimer?: ReturnType<typeof setTimeout> }).ghostTimer = setTimeout(async () => {
      const suggestion = await callAssist("suggest", text.slice(-800));
      if (suggestion && editor.getText().trim() === text) {
        editor.commands.setGhostSuggestion(suggestion);
      }
    }, SUGGEST_DELAY);

    (this.storage as { grammarTimer?: ReturnType<typeof setTimeout> }).grammarTimer = setTimeout(async () => {
      const corrected = await callAssist("grammar", text);
      if (!corrected || editor.getText().trim() !== text) return;
      const diffs = diffWords(text, corrected);
      if (diffs.length === 0) {
        editor.commands.setGrammarIssues([]);
        return;
      }
      const posMap = buildPosMap(editor.state.doc, "\n\n");
      const issues: GrammarIssue[] = [];
      for (const d of diffs) {
        const fromPos = posMap[d.from];
        const toPos = posMap[d.from + d.length - 1];
        if (fromPos !== undefined && fromPos >= 0 && toPos !== undefined && toPos >= 0) {
          issues.push({ from: fromPos, to: toPos + 1, suggestion: d.suggestion });
        }
      }
      editor.commands.setGrammarIssues(issues);
    }, GRAMMAR_DELAY);
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ghostKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(ghostKey);
            if (meta !== undefined) {
              if (!meta.text) return DecorationSet.empty;
              const widget = Decoration.widget(
                meta.pos,
                () => {
                  const span = document.createElement("span");
                  span.textContent = " " + meta.text;
                  span.className = "ai-ghost-suggestion";
                  span.setAttribute("contenteditable", "false");
                  return span;
                },
                { side: 1 }
              );
              return DecorationSet.create(tr.doc, [widget]);
            }
            return tr.docChanged ? DecorationSet.empty : old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
      new Plugin({
        key: grammarKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(grammarKey) as GrammarIssue[] | undefined;
            if (meta) {
              const decos = meta
                .filter(issue => issue.to <= tr.doc.content.size)
                .map(issue =>
                  Decoration.inline(issue.from, issue.to, {
                    class: "ai-grammar-underline",
                    title: `Suggestion: ${issue.suggestion}`,
                  })
                );
              return DecorationSet.create(tr.doc, decos);
            }
            return tr.docChanged ? old.map(tr.mapping, tr.doc) : old;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
