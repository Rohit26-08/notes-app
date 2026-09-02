"use client";
import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
  placeholder?: string;
}

export default function MarkdownPreview({ content, placeholder }: Props) {
  if (!content.trim()) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm italic">
        {placeholder ?? "Nothing to preview yet."}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#1a1a24] border border-[#2e2e3e] rounded-xl p-4 sm:p-6 prose-custom">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-6 mb-3 first:mt-0 pb-2 border-b border-[#2e2e3e]">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-5 mb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base sm:text-lg font-semibold text-zinc-200 mt-4 mb-2 first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-zinc-300 text-sm sm:text-base leading-7 mb-3">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-zinc-300 text-sm sm:text-base leading-7 mb-3 space-y-1 pl-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-zinc-300 text-sm sm:text-base leading-7 mb-3 space-y-1 pl-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-zinc-300">{children}</li>
          ),
          hr: () => (
            <hr className="border-[#3e3e5e] my-5" />
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-violet-500 pl-4 my-3 text-zinc-400 italic">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-200">{children}</em>
          ),
          code: ({ children }) => (
            <code className="bg-[#23232f] text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-[#23232f] rounded-lg p-4 my-3 overflow-x-auto text-xs font-mono text-zinc-300">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
