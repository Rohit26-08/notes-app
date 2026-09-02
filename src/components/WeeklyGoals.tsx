"use client";
import { useState, useEffect, useCallback } from "react";

type GoalCheck = { id: string; day: number; done: boolean };
type Goal = { id: string; weekStart: string; text: string; description: string; checks: GoalCheck[] };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function todayDayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function isDone(goal: Goal, day: number) {
  return goal.checks.find(c => c.day === day)?.done ?? false;
}

export default function WeeklyGoals() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const thisWeek = mondayOf(new Date());
  const todayIdx = todayDayIndex();

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
    setDescription("");
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, text: value, description: description.trim() }),
    });
    const goal: Goal = await res.json();
    setGoals(prev => [...prev, goal]);
  }

  async function toggleDay(goal: Goal, day: number) {
    const nextDone = !isDone(goal, day);
    setGoals(prev =>
      prev.map(g => {
        if (g.id !== goal.id) return g;
        const exists = g.checks.some(c => c.day === day);
        const checks = exists
          ? g.checks.map(c => (c.day === day ? { ...c, done: nextDone } : c))
          : [...g.checks, { id: `tmp-${day}`, day, done: nextDone }];
        return { ...g, checks };
      })
    );
    await fetch(`/api/goals/${goal.id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, done: nextDone }),
    });
  }

  async function removeGoal(id: string) {
    setGoals(prev => prev.filter(g => g.id !== id));
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
  }

  // Bar chart: % of goals done per day
  const dayStats = DAYS.map((_, day) => {
    if (goals.length === 0) return 0;
    const doneCount = goals.filter(g => isDone(g, day)).length;
    return Math.round((doneCount / goals.length) * 100);
  });

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 gap-4 max-w-3xl mx-auto w-full overflow-y-auto scrollbar-thin">
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
      <form onSubmit={addGoal} className="flex flex-col gap-2 shrink-0 bg-[#1a1a24] border border-[#2e2e3e] rounded-xl p-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a goal for this week…"
          className="bg-transparent border border-[#2e2e3e] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500/60 transition-colors"
        />
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="bg-transparent border border-[#2e2e3e] rounded-lg px-3 py-2 text-xs text-zinc-400 placeholder-zinc-700 outline-none focus:border-violet-500/60 transition-colors"
        />
        <button
          type="submit"
          className="self-end px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all"
        >
          + Add
        </button>
      </form>

      {/* Bar chart */}
      {goals.length > 0 && (
        <div className="shrink-0 bg-[#1a1a24] border border-[#2e2e3e] rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-3">Progress by day</div>
          <div className="flex items-end justify-between gap-2 h-24">
            {DAYS.map((d, i) => (
              <div key={d} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] text-zinc-500 tabular-nums">{dayStats[i]}%</span>
                <div className="w-full bg-[#0f0f16] rounded-md flex-1 flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-md transition-all ${i === todayIdx ? "bg-violet-500" : "bg-violet-500/40"}`}
                    style={{ height: `${dayStats[i]}%` }}
                  />
                </div>
                <span className={`text-[11px] font-medium ${i === todayIdx ? "text-violet-300" : "text-zinc-500"}`}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal list, day-wise */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {loading && <div className="text-xs text-zinc-600 py-2">Loading…</div>}
        {!loading && goals.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-8">No goals yet. Add one above to get started.</p>
        )}
        {goals.map(goal => (
          <div key={goal.id} className="bg-[#1a1a24] border border-[#2e2e3e] rounded-xl p-3 group">
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <div className="min-w-0">
                <div className="text-sm text-zinc-200 font-medium truncate">{goal.text}</div>
                {goal.description && (
                  <div className="text-xs text-zinc-500 mt-0.5 truncate">{goal.description}</div>
                )}
              </div>
              <button
                onClick={() => removeGoal(goal.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs px-1 shrink-0 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((d, day) => {
                const done = isDone(goal, day);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDay(goal, day)}
                    className={`flex flex-col items-center gap-1 py-1.5 rounded-lg border transition-all ${
                      done
                        ? "bg-violet-500/20 border-violet-500 text-violet-300"
                        : "border-[#2e2e3e] text-zinc-500 hover:border-zinc-500"
                    } ${day === todayIdx ? "ring-1 ring-violet-500/40" : ""}`}
                  >
                    <span className="text-[10px] font-medium">{d}</span>
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                      done ? "bg-violet-500 border-violet-500 text-white" : "border-zinc-600"
                    }`}>
                      {done && "✓"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
