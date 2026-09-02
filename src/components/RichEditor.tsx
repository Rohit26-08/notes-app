"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface Props {
  content: string;           // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  scriptMode?: boolean;
}

export default function RichEditor({ content, onChange, placeholder, scriptMode }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start writing…",
        emptyEditorClass: "is-empty",
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: [
          "tiptap-editor outline-none min-h-[300px] flex-1",
          scriptMode ? "font-mono text-[13px]" : "font-sans",
        ].join(" "),
      },
    },
  });

  // Sync external content changes (switching days/drafts)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  return <EditorContent editor={editor} className="flex-1 overflow-y-auto" />;
}
