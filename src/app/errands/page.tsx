"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { HABIT_COLORS, formatTime } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  archived: boolean;
}

export default function ErrandsPage() {
  const [errands, setErrands] = useState<Errand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingErrand, setEditingErrand] = useState<Errand | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState(HABIT_COLORS[0]);
  const [formIcon, setFormIcon] = useState("📌");
  const [formDate, setFormDate] = useState(formatDate(new Date()));
  const [formTime, setFormTime] = useState("");
  const [formNote, setFormNote] = useState("");

  const errandIcons = ["📌", "🎂", "🎉", "🎊", "🎈", "🎁", "🎄", "🎃", "🎗️", "🏅", "🏆", "🎓", "💼", "🛒", "🛍️", "📦", "🏥", "💊", "🩺", "✈️", "🚗", "🏠", "📞", "📧", "💌", "💐", "🌹", "🍰", "🧁", "🍕"];

  const fetchErrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/errands?archived=true");
      const data = await res.json();
      setErrands(data);
    } catch (err) {
      console.error("Failed to fetch errands", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErrands();
  }, [fetchErrands]);

  const openCreate = () => {
    setEditingErrand(null);
    setFormName("");
    setFormDesc("");
    setFormColor(HABIT_COLORS[0]);
    setFormIcon("📌");
    setFormDate(formatDate(new Date()));
    setFormTime("");
    setFormNote("");
    setDialogOpen(true);
  };

  const openEdit = (errand: Errand) => {
    setEditingErrand(errand);
    setFormName(errand.name);
    setFormDesc(errand.description || "");
    setFormColor(errand.color);
    setFormIcon(errand.icon);
    setFormDate(errand.date);
    setFormTime(errand.time || "");
    setFormNote(errand.note || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;

    const body = {
      name: formName.trim(),
      description: formDesc.trim() || null,
      icon: formIcon,
      color: formColor,
      date: formDate,
      time: formTime || null,
      note: formNote.trim() || null,
    };

    if (editingErrand) {
      await fetch(`/api/errands/${editingErrand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/errands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setDialogOpen(false);
    fetchErrands();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/errands/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchErrands();
  };

  const toggleComplete = async (errand: Errand) => {
    await fetch(`/api/errands/${errand.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed: !errand.completed,
        completedAt: !errand.completed ? formatDate(new Date()) : null,
      }),
    });
    fetchErrands();
  };

  const formatDateDisplay = (dateStr: string): string => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const isPast = (dateStr: string): boolean => {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date(formatDate(new Date()) + "T00:00:00");
    return d < today;
  };

  const isToday = (dateStr: string): boolean => {
    return dateStr === formatDate(new Date());
  };

  // Group errands by date
  const groupedErrands = errands.reduce<Record<string, Errand[]>>((acc, errand) => {
    if (!acc[errand.date]) acc[errand.date] = [];
    acc[errand.date].push(errand);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedErrands).sort();

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
          <h1 className="text-2xl font-bold tracking-tight">Errands</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Events, reminders & one-time tasks
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Errand
        </Button>
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground mb-3">No errands yet</p>
          <Button onClick={openCreate} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Create your first errand
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateStr) => {
            const dateErrands = groupedErrands[dateStr];
            const past = isPast(dateStr);
            const today = isToday(dateStr);

            return (
              <div key={dateStr}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full",
                    today ? "bg-primary text-primary-foreground" : past ? "bg-muted text-muted-foreground" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {formatDateDisplay(dateStr)}
                    {today && " — Today"}
                  </div>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {dateErrands.map((errand, i) => (
                      <motion.div
                        key={errand.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.03 }}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow group",
                          errand.completed && "opacity-60"
                        )}
                      >
                        <button
                          onClick={() => toggleComplete(errand)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            errand.completed
                              ? "border-green-500 bg-green-500"
                              : "border-muted-foreground/30 hover:border-green-500 hover:bg-green-500/10"
                          )}
                        >
                          {errand.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ backgroundColor: errand.color + "20" }}
                        >
                          {errand.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-medium truncate", errand.completed && "line-through opacity-70")}>
                            {errand.name}
                          </p>
                          {errand.description && (
                            <p className="text-sm text-muted-foreground truncate">{errand.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {errand.time && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatTime(errand.time)}
                              </span>
                            )}
                            {errand.note && (
                              <span className="text-xs text-muted-foreground">📝</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(errand)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(errand.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingErrand ? "Edit Errand" : "New Errand"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="errand-name">Name</Label>
              <Input
                id="errand-name"
                placeholder="e.g. Juan's Birthday, Doctor Appointment"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="errand-desc">Description (optional)</Label>
              <Input
                id="errand-desc"
                placeholder="Short description"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="errand-date">Date</Label>
                <Input
                  id="errand-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="errand-time">Time (optional)</Label>
                <Input
                  id="errand-time"
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map((c, idx) => (
                  <button
                    key={`${c}-${idx}`}
                    onClick={() => setFormColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform",
                      formColor === c && "ring-2 ring-offset-2 ring-primary scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg">
                {errandIcons.map((emoji, idx) => (
                  <button
                    key={`emoji-${idx}`}
                    onClick={() => setFormIcon(emoji)}
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                      formIcon === emoji
                        ? "bg-primary/20 ring-2 ring-primary scale-110"
                        : "hover:bg-muted"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="errand-note">Note (optional)</Label>
              <textarea
                id="errand-note"
                className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Additional notes..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editingErrand ? "Save Changes" : "Create Errand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete Errand?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this errand. This cannot be undone.
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
