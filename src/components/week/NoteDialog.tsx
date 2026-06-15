"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface NoteDialogProps {
  open: boolean;
  data: { habitId: string; date: string; note: string } | null;
  onClose: () => void;
  onSaved: () => void;
}

export function NoteDialog({ open, data, onClose, onSaved }: NoteDialogProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) setNote(data.note || "");
  }, [data]);

  const handleSave = async () => {
    if (!data) return;
    setLoading(true);
    try {
      await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId: data.habitId,
          date: data.date,
          note: note.trim() || null,
        }),
      });
      onSaved();
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Note for {data?.date}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="note">Add a note</Label>
          <textarea
            id="note"
            className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="How did it go? Any thoughts?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
