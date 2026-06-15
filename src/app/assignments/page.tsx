"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { HABIT_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  archived: boolean;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState(HABIT_COLORS[0]);
  const [formIcon, setFormIcon] = useState("📋");
  const [formStartDate, setFormStartDate] = useState(formatDate(new Date()));
  const [formDueDate, setFormDueDate] = useState("");
  const [formNote, setFormNote] = useState("");

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assignments?archived=true");
      const data = await res.json();
      setAssignments(data);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const openCreate = () => {
    setEditingAssignment(null);
    setFormName("");
    setFormDesc("");
    setFormColor(HABIT_COLORS[0]);
    setFormIcon("📋");
    setFormStartDate(formatDate(new Date()));
    setFormDueDate("");
    setFormNote("");
    setDialogOpen(true);
  };

  const openEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormName(assignment.name);
    setFormDesc(assignment.description || "");
    setFormColor(assignment.color);
    setFormIcon(assignment.icon);
    setFormStartDate(assignment.startDate);
    setFormDueDate(assignment.dueDate);
    setFormNote(assignment.note || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formDueDate) return;

    const body = {
      name: formName.trim(),
      description: formDesc.trim() || null,
      icon: formIcon,
      color: formColor,
      startDate: formStartDate,
      dueDate: formDueDate,
      note: formNote.trim() || null,
    };

    if (editingAssignment) {
      await fetch(`/api/assignments/${editingAssignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setDialogOpen(false);
    fetchAssignments();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/assignments/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchAssignments();
  };

  const toggleComplete = async (assignment: Assignment) => {
    await fetch(`/api/assignments/${assignment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completed: !assignment.completed,
        completedAt: !assignment.completed ? formatDate(new Date()) : null,
      }),
    });
    fetchAssignments();
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate + "T00:00:00");
    const today = new Date(formatDate(new Date()) + "T00:00:00");
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const activeAssignments = assignments.filter((a) => !a.archived);
  const completedAssignments = activeAssignments.filter((a) => a.completed);
  const pendingAssignments = activeAssignments.filter((a) => !a.completed);

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
          <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your tasks with deadlines
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Assignment
        </Button>
      </div>

      {/* Pending Assignments */}
      {pendingAssignments.length === 0 && completedAssignments.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <p className="text-muted-foreground mb-3">No assignments yet</p>
          <Button onClick={openCreate} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Create your first assignment
          </Button>
        </div>
      ) : (
        <>
          {pendingAssignments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">In Progress</h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {pendingAssignments.map((assignment, i) => {
                    const daysUntil = getDaysUntilDue(assignment.dueDate);
                    const isOverdue = daysUntil < 0;
                    const isDueToday = daysUntil === 0;

                    return (
                      <motion.div
                        key={assignment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow group"
                      >
                        <button
                          onClick={() => toggleComplete(assignment)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            "border-muted-foreground/30 hover:border-green-500 hover:bg-green-500/10"
                          )}
                        />
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ backgroundColor: assignment.color + "20" }}
                        >
                          {assignment.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{assignment.name}</p>
                          {assignment.description && (
                            <p className="text-sm text-muted-foreground truncate">{assignment.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {assignment.startDate}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className={cn(
                              "flex items-center gap-1 font-medium",
                              isOverdue ? "text-red-500" : isDueToday ? "text-orange-500" : "text-muted-foreground"
                            )}>
                              <Calendar className="w-3 h-3" />
                              {assignment.dueDate}
                              {isOverdue && ` (${Math.abs(daysUntil)}d overdue)`}
                              {isDueToday && " (today)"}
                              {!isOverdue && !isDueToday && ` (${daysUntil}d left)`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(assignment)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(assignment.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Completed Assignments */}
          {completedAssignments.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Completed</h2>
              <div className="space-y-2">
                {completedAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-4 p-4 rounded-xl border bg-card/50 opacity-60"
                  >
                    <button
                      onClick={() => toggleComplete(assignment)}
                      className="w-6 h-6 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </button>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: assignment.color + "20" }}
                    >
                      {assignment.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate line-through opacity-70">{assignment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Completed {assignment.completedAt}
                      </p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm(assignment.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Edit Assignment" : "New Assignment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="assignment-name">Name</Label>
              <Input
                id="assignment-name"
                placeholder="e.g. Math homework, Project report"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-desc">Description (optional)</Label>
              <Input
                id="assignment-desc"
                placeholder="Short description"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            
            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
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

            {/* Emoji */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border rounded-lg">
                {["📋", "📝", "📚", "📖", "✍️", "💻", "🎯", "📊", "📈", "🏆", "⏰", "📅", "🎓", "💡", "🔬", "🎨", "📐", "🧪", "📌"].map((emoji, idx) => (
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
              <Label htmlFor="assignment-note">Note (optional)</Label>
              <textarea
                id="assignment-note"
                className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Additional notes..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || !formDueDate}>
              {editingAssignment ? "Save Changes" : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Delete Assignment?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this assignment. This cannot be undone.
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
