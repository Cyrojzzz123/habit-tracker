"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Archive, Clock, GripVertical } from "lucide-react";
import { cn, getDayName } from "@/lib/utils";
import { HABIT_COLORS, HABIT_EMOJIS, calculateDuration, formatTime } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/TimePicker";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  days: string;
  isTemplate: boolean;
  archived: boolean;
  startTime: string | null;
  endTime: string | null;
  timeSlots: string | null;
  order: number;
}

interface TimeSlot {
  start: string;
  end: string;
}

function SortableHabitItem({
  habit,
  onEdit,
  onArchive,
  onDelete,
}: {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow group",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: habit.color + "20" }}
      >
        {habit.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{habit.name}</p>
        {habit.description && (
          <p className="text-sm text-muted-foreground truncate">{habit.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const active = habit.days.split(",").includes(String(d));
              return (
                <span
                  key={d}
                  className={cn(
                    "w-6 h-6 rounded-full text-[10px] font-medium flex items-center justify-center",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {getDayName(d)[0]}
                </span>
              );
            })}
          </div>
          {habit.startTime && habit.endTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTime(habit.startTime)} - {formatTime(habit.endTime)}</span>
              <span className="text-primary font-medium">
                ({calculateDuration(habit.startTime, habit.endTime)})
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(habit)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => onArchive(habit)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Archive className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => onDelete(habit.id)}
          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState(HABIT_COLORS[0]);
  const [formIcon, setFormIcon] = useState(HABIT_EMOJIS[0]);
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [useCustomTimes, setUseCustomTimes] = useState(false);
  const [customTimeSlots, setCustomTimeSlots] = useState<Record<number, TimeSlot>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/habits?archived=true");
      const data = await res.json();
      setHabits(data);
    } catch (err) {
      console.error("Failed to fetch habits", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = habits.findIndex((h) => h.id === active.id);
      const newIndex = habits.findIndex((h) => h.id === over.id);
      const newHabits = arrayMove(habits, oldIndex, newIndex);
      setHabits(newHabits);

      // Update order in backend
      await Promise.all(
        newHabits.map((h, i) =>
          fetch(`/api/habits/${h.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: i }),
          })
        )
      );
    }
  };

  const openCreate = () => {
    setEditingHabit(null);
    setFormName("");
    setFormDesc("");
    setFormColor(HABIT_COLORS[0]);
    setFormIcon(HABIT_EMOJIS[0]);
    setFormDays([1, 2, 3, 4, 5, 6, 0]);
    setFormStartTime("");
    setFormEndTime("");
    setUseCustomTimes(false);
    setCustomTimeSlots({});
    setDialogOpen(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormName(habit.name);
    setFormDesc(habit.description || "");
    setFormColor(habit.color);
    setFormIcon(habit.icon);
    setFormDays(habit.days ? habit.days.split(",").map(Number) : [1, 2, 3, 4, 5, 6, 0]);
    setFormStartTime(habit.startTime || "");
    setFormEndTime(habit.endTime || "");

    // Parse custom time slots
    if (habit.timeSlots) {
      try {
        const slots = JSON.parse(habit.timeSlots);
        if (slots.default) {
          setFormStartTime(slots.default.start || "");
          setFormEndTime(slots.default.end || "");
        }
        const custom: Record<number, TimeSlot> = {};
        Object.keys(slots).forEach((key) => {
          if (key !== "default") {
            custom[parseInt(key)] = slots[key];
          }
        });
        setCustomTimeSlots(custom);
        setUseCustomTimes(Object.keys(custom).length > 0);
      } catch {
        setCustomTimeSlots({});
        setUseCustomTimes(false);
      }
    } else {
      setCustomTimeSlots({});
      setUseCustomTimes(false);
    }

    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    // Build timeSlots JSON
    let timeSlotsJson = null;
    if (useCustomTimes && Object.keys(customTimeSlots).length > 0) {
      const slots: Record<string, TimeSlot> = {};
      if (formStartTime && formEndTime) {
        slots.default = { start: formStartTime, end: formEndTime };
      }
      Object.entries(customTimeSlots).forEach(([day, slot]) => {
        slots[day] = slot;
      });
      timeSlotsJson = JSON.stringify(slots);
    }

    const body = {
      name: formName.trim(),
      description: formDesc.trim() || null,
      icon: formIcon,
      color: formColor,
      days: [...formDays].sort().join(","),
      isTemplate: true,
      startTime: formStartTime || null,
      endTime: formEndTime || null,
      timeSlots: timeSlotsJson,
    };

    setDialogOpen(false);

    if (editingHabit) {
      // Optimistic update
      setHabits((prev) =>
        prev.map((h) =>
          h.id === editingHabit.id ? { ...h, ...body } : h
        )
      );
      fetch(`/api/habits/${editingHabit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(() => fetchHabits());
    } else {
      // Create and add immediately
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const newHabit = await res.json();
      setHabits((prev) => [...prev, newHabit]);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchHabits();
  };

  const handleArchive = async (habit: Habit) => {
    await fetch(`/api/habits/${habit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !habit.archived }),
    });
    fetchHabits();
  };

  const toggleDay = (day: number) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const activeHabits = habits.filter((h) => !h.archived && h.isTemplate);
  const archivedHabits = habits.filter((h) => h.archived);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Drag to reorder &bull; Manage your recurring habits
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Habit
        </Button>
      </div>

      {/* Active Habits with Drag & Drop */}
      {activeHabits.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground mb-3">No habits yet</p>
          <Button onClick={openCreate} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Create your first habit
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeHabits.map((h) => h.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {activeHabits.map((habit) => (
                <SortableHabitItem
                  key={habit.id}
                  habit={habit}
                  onEdit={openEdit}
                  onArchive={handleArchive}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Archived */}
      {archivedHabits.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Archived</h2>
          <div className="space-y-2">
            {archivedHabits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center gap-4 p-4 rounded-xl border bg-card/50 opacity-60"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: habit.color + "20" }}
                >
                  {habit.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{habit.name}</p>
                </div>
                <button
                  onClick={() => handleArchive(habit)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHabit ? "Edit Habit" : "New Habit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Name</Label>
              <Input
                id="habit-name"
                placeholder="e.g. Exercise, Read, Meditate"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-1.5">
                  {HABIT_COLORS.map((c, idx) => (
                    <button
                      key={`color-${idx}`}
                      onClick={() => setFormColor(c)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-transform",
                        formColor === c && "ring-2 ring-offset-1 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-1">
                  {HABIT_EMOJIS.map((emoji, idx) => (
                    <button
                      key={`emoji-${idx}`}
                      onClick={() => setFormIcon(emoji)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all",
                        formIcon === emoji
                          ? "bg-primary/20 ring-1 ring-primary scale-110"
                          : "hover:bg-muted"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Active Days</Label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "w-9 h-9 rounded-full text-xs font-medium transition-all",
                      formDays.includes(d)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {getDayName(d)[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TimePicker
                label={useCustomTimes ? "Default Start" : "Start Time"}
                value={formStartTime}
                onChange={setFormStartTime}
              />
              <TimePicker
                label={useCustomTimes ? "Default End" : "End Time"}
                value={formEndTime}
                onChange={setFormEndTime}
              />
            </div>

            {/* Custom times per day */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomTimes}
                  onChange={(e) => setUseCustomTimes(e.target.checked)}
                  className="rounded"
                />
                <span>Different times for specific days</span>
              </label>

              {useCustomTimes && (
                <div className="space-y-2 mt-2 p-3 bg-muted/30 rounded-lg max-h-60 overflow-y-auto">
                  {formDays.sort().map((d) => (
                    <div key={d} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-10 flex-shrink-0">{getDayName(d)}</span>
                      <TimePicker
                        value={customTimeSlots[d]?.start || formStartTime}
                        onChange={(val) => setCustomTimeSlots((prev) => ({
                          ...prev,
                          [d]: { start: val, end: prev[d]?.end || formEndTime }
                        }))}
                        className="flex-1 min-w-0"
                      />
                      <span className="text-xs text-muted-foreground flex-shrink-0">-</span>
                      <TimePicker
                        value={customTimeSlots[d]?.end || formEndTime}
                        onChange={(val) => setCustomTimeSlots((prev) => ({
                          ...prev,
                          [d]: { start: prev[d]?.start || formStartTime, end: val }
                        }))}
                        className="flex-1 min-w-0"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formStartTime && formEndTime && !useCustomTimes && (
              <p className="text-xs text-muted-foreground">
                Duration: {calculateDuration(formStartTime, formEndTime)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editingHabit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete Habit?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this habit and all its entries. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
