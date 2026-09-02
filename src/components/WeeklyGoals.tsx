"use client";
import { useState, useEffect, useCallback } from "react";

type Goal = { id: string; weekStart: string; text: string; done: boolean };

function mondayOf(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date.toISOString().split("T")[0];
}

function formatWeek(weekStart: string) {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

function shiftWeek(weekStart: string, delta: number) {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + delta * 7);
  return d.toISOString().split("T")[0];
}

export default function WeeklyGoals() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const thisWeek = mondayOf(new Date());

  const load = useCallback((ws: string) => {
    setLoading(true);
    fetch(`/api/goals?weekStart=${ws}`)
      .then(r => r.json())
      .then((data: Goal[]) => {
        setGoals(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(weekStart); }, [weekStart, load]);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, text: value }),
    });
    const goal: Goal = await res.json();
    setGoals(prev => [...prev, goal]);
  }

  async function toggleDone(goal: Goal) {
    setGoals(prev => prev.map(g => (g.id === goal.id ? { ...g, done: !g.done } : g)));
    await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !goal.done }),
    });
  }

  async function removeGoal(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id));
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
  }

  const doneCount = goals.filter(g => g.done).length;

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 gap-4 max-w-2xl mx-auto w-full">
      {/* Week nav */}
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={() => setWeekStart(w => shiftWeek(w, -1))}
          className="px-3 py-1.5 rounded-lg border border-[#2e2e3e] text-zinc-400 hover:border-violet-500 hover:text-violet-300 transition-all text-sm"
        >
          ← Prev
        </button>
        <div className="text-center">
          <h2 className="text-base sm:text-lg font-bold text-white">{formatWeek(weekStart)}</h2>
          {weekStart === thisWeek && <span className="text-[10px] uppercase tracking-widest text-violet-400">This week</span>}
        </div>
        <button
          onClick={() => setWeekStart(w => shiftWeek(w, 1))}
          className="px-3 py-1.5 rounded-lg border border-[#2e2e3e] text-zinc-400 hover:border-violet-500 hover:text-violet-300 transition-all text-sm"
        >
          Next →
        </button>
      </div>

      {/* Add form */}
      <form onSubmit={addGoal} className="flex gap-2 shrink-0">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a goal for this week…"
          className="flex-1 bg-[#1a1a24] border border-[#2e2e3e] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500/60 transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all"
        >
          + Add
        </button>
      </form>

      {/* Progress */}
      {goals.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 shrink-0">
          <div className="flex-1 h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{ width: `${(doneCount / goals.length) * 100}%` }}
            />
          </div>
          <span>{doneCount}/{goals.length} done</span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-2">
        {loading && <div className="text-xs text-zinc-600 py-2">Loading…</div>}
        {!loading && goals.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-8">No goals yet. Add one above to get started.</p>
        )}
        {goals.map(goal => (
          <div
            key={goal.id}
            className="flex items-center gap-3 bg-[#1a1a24] border border-[#2e2e3e] rounded-lg px-3 py-2.5 group"
          >
            <button
              onClick={() => toggleDone(goal)}
              className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center text-xs transition-all ${
                goal.done
                  ? "bg-violet-500 border-violet-500 text-white"
                  : "border-zinc-600 hover:border-violet-500"
              }`}
            >
              {goal.done && "✓"}
            </button>
            <span className={`flex-1 text-sm ${goal.done ? "text-zinc-600 line-through" : "text-zinc-200"}`}>
              {goal.text}
            </span>
            <button
              onClick={() => removeGoal(goal.id)}
              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs px-1 transition-all"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
