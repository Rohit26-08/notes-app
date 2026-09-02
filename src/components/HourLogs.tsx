"use client";
import { useState, useEffect, useCallback, useRef } from "react";

type HourLog = { id: string; date: string; hour: number; content: string };

function hourLabel(h: number) {
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${period}`;
}

export default function HourLogs({ date }: { date: string }) {
  const [logs, setLogs] = useState<HourLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const debounceRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/hour-logs?date=${date}`)
      .then(r => r.json())
      .then((data: HourLog[]) => {
        setLogs(data);
        setDrafts(Object.fromEntries(data.map(l => [l.hour, l.content])));
        setLoading(false);
      });
  }, [date]);

  const persist = useCallback(async (hour: number, content: string) => {
    const res = await fetch("/api/hour-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, hour, content }),
    });
    const updated: HourLog = await res.json();
    setLogs(prev => {
      const exists = prev.some(l => l.hour === hour);
      return exists ? prev.map(l => (l.hour === hour ? updated : l)) : [...prev, updated].sort((a, b) => a.hour - b.hour);
    });
  }, [date]);

  function onChange(hour: number, value: string) {
    setDrafts(prev => ({ ...prev, [hour]: value }));
    clearTimeout(debounceRefs.current[hour]);
    debounceRefs.current[hour] = setTimeout(() => persist(hour, value), 800);
  }

  async function removeEntry(hour: number) {
    clearTimeout(debounceRefs.current[hour]);
    await fetch(`/api/hour-logs/${date}/${hour}`, { method: "DELETE" });
    setLogs(prev => prev.filter(l => l.hour !== hour));
    setDrafts(prev => {
      const next = { ...prev };
      delete next[hour];
      return next;
    });
  }

  if (loading) return <div className="text-xs text-zinc-600 py-2">Loading hourly log…</div>;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col gap-1.5">
      {hours.map(h => {
        const value = drafts[h] ?? "";
        const hasEntry = logs.some(l => l.hour === h);
        return (
          <div key={h} className="flex items-start gap-2 group">
            <span className="text-[11px] text-zinc-600 w-16 shrink-0 pt-2 tabular-nums">{hourLabel(h)}</span>
            <input
              value={value}
              onChange={e => onChange(h, e.target.value)}
              placeholder="What did you do…"
              className="flex-1 bg-[#1a1a24] border border-[#2e2e3e] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 outline-none focus:border-violet-500/60 transition-colors"
            />
            {hasEntry && (
              <button
                onClick={() => removeEntry(h)}
                title="Clear entry"
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs px-1.5 py-1.5 transition-all"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
