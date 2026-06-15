"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Flame, Target, Calendar } from "lucide-react";
import { formatDate, getWeekDates, getPercentage } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  days: string;
  isTemplate: boolean;
  archived: boolean;
}

interface Entry {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

interface StreakData {
  [habitId: string]: { current: number; longest: number };
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function StatsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [streaks, setStreaks] = useState<StreakData>({});
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const weekDates = getWeekDates(today);
  const fromDate = formatDate(weekDates[0]);
  const toDate = formatDate(weekDates[6]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [habitsRes, entriesRes, streaksRes] = await Promise.all([
        fetch("/api/habits"),
        fetch(`/api/entries?from=${fromDate}&to=${toDate}`),
        fetch("/api/streaks"),
      ]);
      setHabits(await habitsRes.json());
      setEntries(await entriesRes.json());
      setStreaks(await streaksRes.json());
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeHabits = habits.filter((h) => h.isTemplate && !h.archived);

  // Weekly completion data for chart
  const weeklyData = weekDates.map((date) => {
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();
    const dayHabits = activeHabits.filter((h) => {
      const days = h.days.split(",").map(Number);
      return days.includes(dayOfWeek);
    });
    const done = dayHabits.filter((h) => {
      return entries.some((e) => e.habitId === h.id && e.date === dateStr && e.completed);
    }).length;
    const total = dayHabits.length;
    return {
      name: date.toLocaleDateString("en-US", { weekday: "short" }),
      completed: done,
      total,
      percentage: total > 0 ? getPercentage(done, total) : 0,
    };
  });

  // Per-habit completion data
  const habitData = activeHabits.map((habit) => {
    const habitEntries = entries.filter((e) => e.habitId === habit.id);
    const completed = habitEntries.filter((e) => e.completed).length;
    const total = habitEntries.length;
    return {
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      completed,
      total,
      percentage: total > 0 ? getPercentage(completed, total) : 0,
    };
  });

  // Overall stats
  const totalCompleted = entries.filter((e) => e.completed).length;
  const totalEntries = entries.length;
  const overallPercentage = totalEntries > 0 ? getPercentage(totalCompleted, totalEntries) : 0;

  // Best streak
  const bestStreak = Object.values(streaks).reduce((max, s) => Math.max(max, s.longest), 0);
  const currentBestStreak = Object.values(streaks).reduce((max, s) => Math.max(max, s.current), 0);

  // Pie chart data
  const pieData = activeHabits.map((habit, i) => ({
    name: habit.name,
    value: entries.filter((e) => e.habitId === habit.id && e.completed).length,
    color: habit.color || COLORS[i % COLORS.length],
  })).filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase">This Week</span>
          </div>
          <p className="text-2xl font-bold">{overallPercentage}%</p>
          <p className="text-xs text-muted-foreground">{totalCompleted}/{totalEntries} completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs uppercase">Current Best</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{currentBestStreak}</p>
          <p className="text-xs text-muted-foreground">day streak</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase">Best Ever</span>
          </div>
          <p className="text-2xl font-bold text-purple-500">{bestStreak}</p>
          <p className="text-xs text-muted-foreground">day streak</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs uppercase">Active</span>
          </div>
          <p className="text-2xl font-bold">{activeHabits.length}</p>
          <p className="text-xs text-muted-foreground">habits tracked</p>
        </motion.div>
      </div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border bg-card p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Weekly Completion</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.completed}/{data.total} habits ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Per-Habit Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border bg-card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Per-Habit Completion</h2>
          <div className="space-y-3">
            {habitData.map((habit) => (
              <div key={habit.name} className="flex items-center gap-3">
                <span className="text-lg w-8">{habit.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{habit.name}</span>
                    <span className="text-sm text-muted-foreground">{habit.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${habit.percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {habit.completed}/{habit.total}
                </span>
              </div>
            ))}
            {habitData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No habits yet</p>
            )}
          </div>
        </motion.div>

        {/* Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border bg-card p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Completion Distribution</h2>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">{data.value} completions</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No data yet
              </div>
            )}
          </div>
          {pieData.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Streaks Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-xl border bg-card p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Streak Leaderboard</h2>
        <div className="space-y-2">
          {activeHabits
            .map((h) => ({
              ...h,
              current: streaks[h.id]?.current || 0,
              longest: streaks[h.id]?.longest || 0,
            }))
            .sort((a, b) => b.current - a.current)
            .map((habit, i) => (
              <div
                key={habit.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-sm font-bold text-muted-foreground w-6">
                  {i + 1}.
                </span>
                <span className="text-lg">{habit.icon}</span>
                <span className="flex-1 font-medium">{habit.name}</span>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">{habit.current}</span>
                    <span className="text-muted-foreground">current</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span>Best: {habit.longest}</span>
                  </div>
                </div>
              </div>
            ))}
          {activeHabits.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No habits yet</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
