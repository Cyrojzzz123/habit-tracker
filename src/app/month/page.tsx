"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, ArrowRight, Clock } from "lucide-react";
import { cn, formatDate, getMonthDates, getPercentage, getDayOfWeek } from "@/lib/utils";
import { MONTH_NAMES, DAY_SHORT, formatTime } from "@/lib/constants";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  days: string;
  isTemplate: boolean;
}

interface Entry {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  note: string | null;
}

interface Assignment {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  startDate: string;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
  note: string | null;
}

interface Errand {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  date: string;
  time: string | null;
  completed: boolean;
  completedAt: string | null;
  note: string | null;
}

interface TooltipData {
  date: Date;
  dateStr: string;
  dayAssignments: Assignment[];
  dueAssignments: Assignment[];
  dayErrands: Errand[];
  x: number;
  y: number;
  showAbove: boolean;
}

export default function MonthPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const firstDay = formatDate(new Date(year, month, 1));
  const lastDay = formatDate(new Date(year, month + 1, 0));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [habitsRes, entriesRes, assignmentsRes, errandsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch(`/api/entries?from=${firstDay}&to=${lastDay}`),
        fetch(`/api/assignments?from=${firstDay}&to=${lastDay}`),
        fetch(`/api/errands?from=${firstDay}&to=${lastDay}`),
      ]);
      setHabits(await habitsRes.json());
      setEntries(await entriesRes.json());
      setAssignments(await assignmentsRes.json());
      setErrands(await errandsRes.json());
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  }, [firstDay, lastDay]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cells = getMonthDates(year, month);

  const getHabitsForDate = (dateStr: string): Habit[] => {
    const date = new Date(dateStr + "T00:00:00");
    const dayOfWeek = getDayOfWeek(date);

    return habits.filter((h) => {
      if (!h.isTemplate) return false;
      const days = h.days.split(",").map(Number);
      return days.includes(dayOfWeek);
    });
  };

  const getDayPercentage = (dateStr: string): number => {
    const dayHabits = getHabitsForDate(dateStr);
    if (dayHabits.length === 0) return -1;
    const done = dayHabits.filter((h) => {
      return entries.some((e) => e.habitId === h.id && e.date === dateStr && e.completed);
    }).length;
    return getPercentage(done, dayHabits.length);
  };

  const getAssignmentsForDate = (dateStr: string): Assignment[] => {
    return assignments.filter((a) => a.startDate === dateStr);
  };

  const getAssignmentsDueOnDate = (dateStr: string): Assignment[] => {
    return assignments.filter((a) => a.dueDate === dateStr);
  };

  const getAssignmentsInRange = (dateStr: string): Assignment[] => {
    return assignments.filter((a) => a.startDate <= dateStr && a.dueDate >= dateStr);
  };

  const getErrandsForDate = (dateStr: string): Errand[] => {
    return errands.filter((e) => e.date === dateStr);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const isToday = (dateStr: string) => dateStr === formatDate(today);

  const selectedDateHabits = selectedDate
    ? habits
        .filter((h) => {
          if (!h.isTemplate) return false;
          const d = new Date(selectedDate + "T00:00:00");
          return h.days.split(",").includes(String(getDayOfWeek(d)));
        })
        .map((h) => {
          const entry = entries.find((e) => e.habitId === h.id && e.date === selectedDate);
          return { habit: h, entry };
        })
    : [];

  const selectedDateAssignments = selectedDate ? getAssignmentsInRange(selectedDate) : [];
  const selectedDateErrands = selectedDate ? getErrandsForDate(selectedDate) : [];

  const selectedPct = selectedDate ? getDayPercentage(selectedDate) : 0;

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate + "T00:00:00");
    const todayDate = new Date(formatDate(today) + "T00:00:00");
    const diffTime = due.getTime() - todayDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDateShort = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleMouseEnter = (e: React.MouseEvent, date: Date, dateStr: string, dayAssignments: Assignment[], dueAssignments: Assignment[], dayErrands: Errand[]) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const showAbove = rect.top > viewportHeight / 2;

    setTooltip({
      date,
      dateStr,
      dayAssignments,
      dueAssignments,
      dayErrands,
      x: rect.left + rect.width / 2,
      y: showAbove ? rect.top : rect.bottom,
      showAbove,
    });
  };

  const handleMouseLeave = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip(null);
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Monthly View</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2">
          <span>0%</span>
          <div className="flex gap-0.5">
            {[0, 20, 40, 60, 80, 100].map((level) => (
              <div
                key={level}
                className="w-5 h-5 rounded-sm"
                style={{
                  backgroundColor:
                    level === 0
                      ? "hsl(var(--muted))"
                      : `hsl(142 76% ${56 - level * 0.3}%)`,
                  opacity: level === 0 ? 1 : 0.3 + (level / 100) * 0.7,
                }}
              />
            ))}
          </div>
          <span>100%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Assignment start</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Assignment due</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Errand</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-xl">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-muted/50 rounded-t-xl">
          {DAY_SHORT.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square border-b border-r" />;
            }

            const dateStr = formatDate(date);
            const pct = getDayPercentage(dateStr);
            const todayMark = isToday(dateStr);
            const dayAssignments = getAssignmentsForDate(dateStr);
            const dueAssignments = getAssignmentsDueOnDate(dateStr);
            const dayErrands = getErrandsForDate(dateStr);
            const hasItems = dayAssignments.length > 0 || dueAssignments.length > 0 || dayErrands.length > 0;

            return (
              <motion.button
                key={dateStr}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.008 }}
                onClick={() => setSelectedDate(dateStr)}
                onMouseEnter={(e) => hasItems && handleMouseEnter(e, date, dateStr, dayAssignments, dueAssignments, dayErrands)}
                onMouseLeave={handleMouseLeave}
                className={cn(
                  "aspect-square border-b border-r relative overflow-hidden transition-all hover:brightness-95",
                  todayMark && "ring-2 ring-primary ring-inset"
                )}
              >
                {/* Fill bar from bottom */}
                {pct > 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                    style={{
                      height: `${pct}%`,
                      backgroundColor: pct === 100 ? "#22c55e" : "#86efac",
                      opacity: pct === 100 ? 0.9 : 0.6,
                    }}
                  />
                )}
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 h-full">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      todayMark && "text-primary font-bold",
                      pct >= 70 && "text-white"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {pct > 0 && (
                    <span
                      className={cn(
                        "text-[10px] font-bold",
                        pct >= 70 ? "text-white/90" : "text-green-700 dark:text-green-300"
                      )}
                    >
                      {pct}%
                    </span>
                  )}
                  {/* Item indicators */}
                  {hasItems && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayAssignments.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      {dueAssignments.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                      {dayErrands.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Portal-rendered tooltip */}
      {typeof window !== "undefined" && tooltip && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.showAbove ? tooltip.y - 8 : tooltip.y + 8,
            transform: `translate(-50%, ${tooltip.showAbove ? "-100%" : "0%"})`,
          }}
          onMouseEnter={() => {
            if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          <div className="bg-popover border rounded-lg shadow-xl p-3 w-60 text-left">
            <p className="text-xs font-medium mb-2 pb-1 border-b">
              {tooltip.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <div className="space-y-1.5">
              {/* Assignments starting */}
              {tooltip.dayAssignments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs p-1.5 rounded" style={{ backgroundColor: a.color + "15" }}>
                  <span className="text-sm">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.name}</p>
                    <p className="text-muted-foreground text-[10px]">Due {formatDateShort(a.dueDate)}</p>
                  </div>
                </div>
              ))}
              {/* Assignments due */}
              {tooltip.dueAssignments.map((a) => (
                <div key={`due-${a.id}`} className="flex items-center gap-2 text-xs p-1.5 rounded bg-orange-500/10">
                  <span className="text-sm">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{a.name}</p>
                    <p className="text-orange-500 text-[10px] font-medium">Due today</p>
                  </div>
                </div>
              ))}
              {/* Errands */}
              {tooltip.dayErrands.map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-xs p-1.5 rounded" style={{ backgroundColor: e.color + "15" }}>
                  <span className="text-sm">{e.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.name}</p>
                    {e.time && (
                      <p className="text-muted-foreground text-[10px] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(e.time)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Arrow */}
            <div
              className={cn(
                "absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-[6px] border-transparent",
                tooltip.showAbove
                  ? "top-full border-t-popover"
                  : "bottom-full border-b-popover"
              )}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Day Detail Sheet */}
      <Sheet open={selectedDate !== null} onOpenChange={(v) => !v && setSelectedDate(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Percentage display */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                  <circle
                    cx="18" cy="18" r="16" fill="none"
                    stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${selectedPct >= 0 ? selectedPct : 0} ${100 - (selectedPct >= 0 ? selectedPct : 0)}`}
                    strokeLinecap="round"
                    className={cn(
                      "transition-all",
                      selectedPct === 100 ? "text-green-500" : selectedPct > 0 ? "text-primary" : "text-muted"
                    )}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                  {selectedPct >= 0 ? `${selectedPct}%` : "—"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedPct === 100
                  ? "Perfect day! 🎉"
                  : selectedPct >= 60
                  ? "Great progress!"
                  : selectedPct > 0
                  ? "Keep going!"
                  : selectedPct === 0
                  ? "No habits completed"
                  : "No habits scheduled"}
              </p>
            </div>

            {/* Habits section */}
            {selectedDateHabits.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Habits</h3>
                {selectedDateHabits.map(({ habit, entry }) => (
                  <div
                    key={habit.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      entry?.completed ? "bg-green-500/10" : "bg-card"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        entry?.completed ? "border-green-500 bg-green-500" : "border-muted-foreground/30"
                      )}
                    >
                      {entry?.completed && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={cn("flex-1 text-sm", entry?.completed && "line-through opacity-70")}>
                      {habit.name}
                    </span>
                    {entry?.note && (
                      <span className="text-xs text-muted-foreground italic">📝</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Assignments section */}
            {selectedDateAssignments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Assignments</h3>
                {selectedDateAssignments.map((assignment) => {
                  const isStart = assignment.startDate === selectedDate;
                  const isDue = assignment.dueDate === selectedDate;
                  const daysUntil = getDaysUntilDue(assignment.dueDate);

                  return (
                    <div
                      key={assignment.id}
                      className="p-3 rounded-lg border"
                      style={{ borderLeft: `4px solid ${assignment.color}` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{assignment.icon}</span>
                        <span className="font-medium">{assignment.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Start: {formatDateShort(assignment.startDate)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className={cn(
                          "flex items-center gap-1 font-medium",
                          isDue ? "text-orange-500" : "text-muted-foreground"
                        )}>
                          <Calendar className="w-3 h-3" />
                          Due: {formatDateShort(assignment.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {isStart && (
                          <span className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                            Started here
                          </span>
                        )}
                        {isDue && (
                          <span className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full",
                            assignment.completed ? "text-green-500 bg-green-500/10" : "text-orange-500 bg-orange-500/10"
                          )}>
                            {assignment.completed ? "Completed" : "Due today"}
                          </span>
                        )}
                        {!isStart && !isDue && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {daysUntil > 0 ? `${daysUntil} days until due` : `${Math.abs(daysUntil)} days overdue`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Errands section */}
            {selectedDateErrands.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Errands</h3>
                {selectedDateErrands.map((errand) => (
                  <div
                    key={errand.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      errand.completed && "opacity-60"
                    )}
                    style={{ borderLeft: `4px solid ${errand.color}` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{errand.icon}</span>
                      <span className={cn("font-medium", errand.completed && "line-through")}>{errand.name}</span>
                    </div>
                    {errand.description && (
                      <p className="text-xs text-muted-foreground mb-1">{errand.description}</p>
                    )}
                    {errand.time && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(errand.time)}
                      </p>
                    )}
                    {errand.note && (
                      <p className="text-xs text-muted-foreground mt-1 italic">📝 {errand.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {selectedDateHabits.length === 0 && selectedDateAssignments.length === 0 && selectedDateErrands.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nothing scheduled</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
