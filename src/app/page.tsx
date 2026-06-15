"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDate, getWeekDates, getDayOfWeek, getPercentage } from "@/lib/utils";
import { DAY_SHORT, formatTime } from "@/lib/constants";
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTaskDialog } from "@/components/week/AddTaskDialog";
import { NoteDialog } from "@/components/week/NoteDialog";
import { ProgressRing } from "@/components/ProgressRing";
import { HoverInfo } from "@/components/HoverInfo";
import { showUndoToast } from "@/components/UndoToast";
import confetti from "canvas-confetti";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  days: string;
  isTemplate: boolean;
  startTime: string | null;
  endTime: string | null;
  timeSlots: string | null;
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

type DragItem = {
  type: "habit" | "assignment-start" | "assignment-due" | "errand";
  id: string;
  name: string;
  icon: string;
  color: string;
  currentDate: string;
};

function DraggableItem({
  id,
  type,
  children,
}: {
  id: string;
  type: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${type}:${id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-opacity duration-200",
        isDragging && "opacity-30"
      )}
    >
      <div className="flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none rounded"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

function DroppableDay({
  dateStr,
  children,
}: {
  dateStr: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `day:${dateStr}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-all duration-200 rounded-xl",
        isOver && "ring-2 ring-primary ring-inset bg-primary/5 scale-[1.02]"
      )}
    >
      {children}
    </div>
  );
}

function DragOverlayContent({ item }: { item: DragItem }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card border-2 border-primary shadow-2xl text-sm pointer-events-none">
      <span className="text-lg">{item.icon}</span>
      <span className="font-medium">{item.name}</span>
    </div>
  );
}

export default function WeekPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskDate, setAddTaskDate] = useState<string | null>(null);
  const [noteEntry, setNoteEntry] = useState<{ habitId: string; date: string; note: string } | null>(null);
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);

  const today = new Date();
  const anchorDate = new Date(today);
  anchorDate.setDate(today.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(anchorDate);

  const fromDate = formatDate(weekDates[0]);
  const toDate = formatDate(weekDates[6]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [habitsRes, entriesRes, assignmentsRes, errandsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch(`/api/entries?from=${fromDate}&to=${toDate}`),
        fetch(`/api/assignments?from=${fromDate}&to=${toDate}`),
        fetch(`/api/errands?from=${fromDate}&to=${toDate}`),
      ]);
      setHabits(await habitsRes.json());
      setEntries(await entriesRes.json());
      setAssignments(await assignmentsRes.json());
      setErrands(await errandsRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    const handleFocus = () => fetchData();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchData]);

  // Get time for a specific day based on timeSlots
  const getTimeForDay = (habit: Habit, dayOfWeek: number): { start: string | null; end: string | null } => {
    if (habit.timeSlots) {
      try {
        const slots = JSON.parse(habit.timeSlots);
        // Check for day-specific slot
        if (slots[dayOfWeek]) {
          return { start: slots[dayOfWeek].start, end: slots[dayOfWeek].end };
        }
        // Fall back to default
        if (slots.default) {
          return { start: slots.default.start, end: slots.default.end };
        }
      } catch {
        // ignore parse errors
      }
    }
    return { start: habit.startTime, end: habit.endTime };
  };

  const getHabitsForDate = (date: Date): Habit[] => {
    const dayOfWeek = getDayOfWeek(date);
    const dateStr = formatDate(date);
    const templateHabits = habits.filter((h) => {
      if (!h.isTemplate) return false;
      return h.days.split(",").map(Number).includes(dayOfWeek);
    });
    const oneOffHabits = habits.filter((h) => {
      if (h.isTemplate) return false;
      return entries.some((e) => e.habitId === h.id && e.date === dateStr);
    });
    return [...templateHabits, ...oneOffHabits];
  };

  const getAssignmentsForDate = (date: Date): Assignment[] => {
    const dateStr = formatDate(date);
    return assignments.filter((a) => a.startDate === dateStr);
  };

  const getAssignmentsDueOnDate = (date: Date): Assignment[] => {
    const dateStr = formatDate(date);
    return assignments.filter((a) => a.dueDate === dateStr);
  };

  const getErrandsForDate = (date: Date): Errand[] => {
    const dateStr = formatDate(date);
    return errands.filter((e) => e.date === dateStr);
  };

  const getEntry = (habitId: string, date: string): Entry | undefined => {
    return entries.find((e) => e.habitId === habitId && e.date === date);
  };

  const toggleEntry = async (habitId: string, date: string, showUndo = true) => {
    const existing = getEntry(habitId, date);
    const wasCompleted = existing?.completed ?? false;

    if (existing) {
      const res = await fetch("/api/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: existing.id, completed: !existing.completed }),
      });
      const updated = await res.json();
      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      if (wasCompleted && showUndo) {
        const habit = habits.find((h) => h.id === habitId);
        const entryId = existing.id;
        showUndoToast({
          message: `Unchecked "${habit?.name}"`,
          onUndo: async () => {
            // Directly re-complete the entry without showing undo again
            const res = await fetch("/api/entries", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: entryId, completed: true }),
            });
            const reverted = await res.json();
            setEntries((prev) => prev.map((e) => (e.id === reverted.id ? reverted : e)));
          },
        });
      }
    } else {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date, completed: true }),
      });
      const created = await res.json();
      setEntries((prev) => [...prev, created]);
    }

    if (!wasCompleted) {
      const dateObj = new Date(date + "T00:00:00");
      const dayHabits = getHabitsForDate(dateObj);
      const allDone = dayHabits.every((h) => {
        const entry = entries.find((e) => e.habitId === h.id && e.date === date);
        return entry?.completed || h.id === habitId;
      });
      if (allDone && dayHabits.length > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#3b82f6"],
        });
      }
    }
  };

  const toggleAssignment = async (assignment: Assignment) => {
    const res = await fetch(`/api/assignments/${assignment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed: !assignment.completed,
        completedAt: !assignment.completed ? formatDate(today) : null,
      }),
    });
    const updated = await res.json();
    setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const toggleErrand = async (errand: Errand) => {
    const res = await fetch(`/api/errands/${errand.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed: !errand.completed,
        completedAt: !errand.completed ? formatDate(today) : null,
      }),
    });
    const updated = await res.json();
    setErrands((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const getDayPercentage = (date: Date): number => {
    const dateStr = formatDate(date);
    const dayHabits = getHabitsForDate(date);
    if (dayHabits.length === 0) return 0;
    const done = dayHabits.filter((h) => {
      const entry = getEntry(h.id, dateStr);
      return entry?.completed;
    }).length;
    return getPercentage(done, dayHabits.length);
  };

  const getDayTotalDuration = (date: Date): string => {
    const dayHabits = getHabitsForDate(date);
    let totalMinutes = 0;
    dayHabits.forEach((h) => {
      if (h.startTime && h.endTime) {
        const [sh, sm] = h.startTime.split(":").map(Number);
        const [eh, em] = h.endTime.split(":").map(Number);
        let dur = (eh * 60 + em) - (sh * 60 + sm);
        if (dur < 0) dur += 1440;
        totalMinutes += dur;
      }
    });
    if (totalMinutes === 0) return "";
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate + "T00:00:00");
    const todayDate = new Date(formatDate(today) + "T00:00:00");
    return Math.ceil((due.getTime() - todayDate.getTime()) / 86400000);
  };

  const isToday = (date: Date): boolean => formatDate(date) === formatDate(today);

  // Drag & Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const [type, id] = (active.id as string).split(":");

    if (type === "assignment-start") {
      const a = assignments.find((a) => a.id === id);
      if (a) setActiveItem({ type, id, name: a.name, icon: a.icon, color: a.color, currentDate: a.startDate });
    } else if (type === "assignment-due") {
      const a = assignments.find((a) => a.id === id);
      if (a) setActiveItem({ type, id, name: a.name, icon: a.icon, color: a.color, currentDate: a.dueDate });
    } else if (type === "errand") {
      const e = errands.find((e) => e.id === id);
      if (e) setActiveItem({ type, id, name: e.name, icon: e.icon, color: e.color, currentDate: e.date });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear overlay immediately
    setActiveItem(null);

    if (!over) return;

    const [itemType, itemId] = (active.id as string).split(":");
    const targetDate = (over.id as string).replace("day:", "");

    if (!targetDate || targetDate === "undefined") return;

    // Optimistic update - update state immediately
    if (itemType === "assignment-start") {
      const assignment = assignments.find((a) => a.id === itemId);
      if (assignment && assignment.startDate !== targetDate) {
        setAssignments((prev) =>
          prev.map((a) => (a.id === itemId ? { ...a, startDate: targetDate } : a))
        );
        fetch(`/api/assignments/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate: targetDate }),
        });
      }
    } else if (itemType === "assignment-due") {
      const assignment = assignments.find((a) => a.id === itemId);
      if (assignment && assignment.dueDate !== targetDate) {
        setAssignments((prev) =>
          prev.map((a) => (a.id === itemId ? { ...a, dueDate: targetDate } : a))
        );
        fetch(`/api/assignments/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueDate: targetDate }),
        });
      }
    } else if (itemType === "errand") {
      const errand = errands.find((e) => e.id === itemId);
      if (errand && errand.date !== targetDate) {
        setErrands((prev) =>
          prev.map((e) => (e.id === itemId ? { ...e, date: targetDate } : e))
        );
        fetch(`/api/errands/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: targetDate }),
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Weekly View</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} —{" "}
              {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors">
              Today
            </button>
            <button onClick={() => setWeekOffset((o) => o + 1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-start">
          {weekDates.map((date) => {
            const dateStr = formatDate(date);
            const dayHabits = getHabitsForDate(date);
            const dayAssignments = getAssignmentsForDate(date);
            const dueAssignments = getAssignmentsDueOnDate(date);
            const dayErrands = getErrandsForDate(date);
            const pct = getDayPercentage(date);
            const todayMark = isToday(date);
            const totalDuration = getDayTotalDuration(date);

            return (
              <DroppableDay key={dateStr} dateStr={dateStr}>
                <div
                  className={cn(
                    "rounded-xl border bg-card p-3 flex flex-col gap-2 min-h-[120px] overflow-hidden transition-all duration-200",
                    todayMark && "ring-2 ring-primary shadow-lg"
                  )}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={cn("text-xs font-medium uppercase tracking-wider", todayMark ? "text-primary" : "text-muted-foreground")}>
                        {DAY_SHORT[getDayOfWeek(date)]}
                      </span>
                      <p className={cn("text-lg font-bold", todayMark && "text-primary")}>{date.getDate()}</p>
                    </div>
                    <ProgressRing percentage={pct} size={40} strokeWidth={3} showLabel={true} />
                  </div>

                  {totalDuration && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Total: {totalDuration}</span>
                    </div>
                  )}

                  {/* Habits */}
                  <div className="flex flex-col gap-1">
                    {dayHabits.map((habit) => {
                      const entry = getEntry(habit.id, dateStr);
                      const done = entry?.completed ?? false;
                      const dayTime = getTimeForDay(habit, getDayOfWeek(date));
                      return (
                        <HoverInfo
                          key={habit.id}
                          name={habit.name}
                          description={null}
                          note={entry?.note}
                          startTime={dayTime.start}
                          endTime={dayTime.end}
                          icon={habit.icon}
                        >
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleEntry(habit.id, dateStr)}
                            className={cn(
                              "flex flex-col gap-0.5 px-2 py-1.5 rounded-lg text-left text-xs transition-all w-full",
                              done ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted/50 hover:bg-muted text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <div className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0", done ? "border-green-500 bg-green-500" : "border-muted-foreground/30")}>
                                {done && (
                                  <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 text-white" viewBox="0 0 12 12">
                                    <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </motion.svg>
                                )}
                              </div>
                              <span className={cn("flex-1 truncate", done && "line-through opacity-70")}>{habit.name}</span>
                            </div>
                            {dayTime.start && dayTime.end && (
                              <div className="flex items-center gap-1 text-[9px] text-muted-foreground ml-5">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{formatTime(dayTime.start)} - {formatTime(dayTime.end)}</span>
                              </div>
                            )}
                          </motion.button>
                        </HoverInfo>
                      );
                    })}
                  </div>

                  {/* Assignments */}
                  {(dayAssignments.length > 0 || dueAssignments.length > 0) && (
                    <div className="border-t pt-1.5">
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Assignments</p>
                      <div className="flex flex-col gap-1">
                        {dayAssignments.map((a) => {
                          const daysUntil = getDaysUntilDue(a.dueDate);
                          return (
                            <DraggableItem key={`start-${a.id}`} id={a.id} type="assignment-start">
                              <HoverInfo
                                name={a.name}
                                description={a.description}
                                note={a.note}
                                dueDate={a.dueDate}
                                daysUntil={daysUntil}
                                color={a.color}
                                icon={a.icon}
                              >
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs" style={{ backgroundColor: a.color + "15", borderLeft: `2px solid ${a.color}` }}>
                                  <span className="text-xs">{a.icon}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-[11px]">{a.name}</p>
                                    <p className="text-[9px] text-muted-foreground">
                                      {daysUntil > 0 ? `Due in ${daysUntil}d` : daysUntil === 0 ? "Due today" : "Overdue"}
                                    </p>
                                  </div>
                                </div>
                              </HoverInfo>
                            </DraggableItem>
                          );
                        })}
                        {dueAssignments.map((a) => (
                          <DraggableItem key={`due-${a.id}`} id={a.id} type="assignment-due">
                            <HoverInfo
                              name={a.name}
                              description={a.description}
                              note={a.note}
                              dueDate={a.dueDate}
                              daysUntil={0}
                              color={a.color}
                              icon={a.icon}
                            >
                              <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs", a.completed ? "bg-green-500/10" : "bg-orange-500/10")}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleAssignment(a); }}
                                  className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0", a.completed ? "border-green-500 bg-green-500" : "border-orange-500")}
                                >
                                  {a.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("font-medium truncate text-[11px]", a.completed && "line-through opacity-70")}>{a.name}</p>
                                  <p className="text-[9px] text-muted-foreground">{a.completed ? "Done" : "Due today"}</p>
                                </div>
                              </div>
                            </HoverInfo>
                          </DraggableItem>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errands */}
                  {dayErrands.length > 0 && (
                    <div className="border-t pt-1.5">
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Errands</p>
                      <div className="flex flex-col gap-1">
                        {dayErrands.map((e) => (
                          <DraggableItem key={e.id} id={e.id} type="errand">
                            <HoverInfo
                              name={e.name}
                              description={e.description}
                              note={e.note}
                              time={e.time}
                              color={e.color}
                              icon={e.icon}
                            >
                              <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md text-xs", e.completed ? "bg-green-500/10" : "")} style={!e.completed ? { backgroundColor: e.color + "15", borderLeft: `2px solid ${e.color}` } : { borderLeft: "2px solid #22c55e" }}>
                                <button
                                  onClick={(ev) => { ev.stopPropagation(); toggleErrand(e); }}
                                  className={cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0", e.completed ? "border-green-500 bg-green-500" : "border-muted-foreground/30")}
                                >
                                  {e.completed && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                                </button>
                                <span className="text-xs">{e.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("font-medium truncate text-[11px]", e.completed && "line-through opacity-70")}>{e.name}</p>
                                  {e.time && (
                                    <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-2 h-2" />
                                      {formatTime(e.time)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </HoverInfo>
                          </DraggableItem>
                        ))}
                      </div>
                    </div>
                  )}

                  {dayHabits.length === 0 && dayAssignments.length === 0 && dueAssignments.length === 0 && dayErrands.length === 0 && (
                    <p className="text-xs text-muted-foreground italic mt-1">No tasks</p>
                  )}

                  <button
                    onClick={() => setAddTaskDate(dateStr)}
                    className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground py-1.5 rounded-lg hover:bg-muted transition-colors mt-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add task
                  </button>
                </div>
              </DroppableDay>
            );
          })}
        </div>

        <AddTaskDialog
          open={addTaskDate !== null}
          date={addTaskDate || ""}
          onClose={() => setAddTaskDate(null)}
          onAdded={() => { setAddTaskDate(null); fetchData(); }}
        />

        <NoteDialog
          open={noteEntry !== null}
          data={noteEntry}
          onClose={() => setNoteEntry(null)}
          onSaved={() => { setNoteEntry(null); fetchData(); }}
        />
      </div>

      <DragOverlay>
        {activeItem ? <DragOverlayContent item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
