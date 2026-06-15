"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Cloud, Download, Trash2, Bell, Zap, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [notifStatus, setNotifStatus] = useState("checking...");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setNotifStatus("not supported");
      } else {
        setNotifStatus(Notification.permission);
      }
    }
  }, []);

  const handleEnable = async () => {
    try {
      const result = await Notification.requestPermission();
      setNotifStatus(result);
    } catch (err) {
      console.error("Permission error:", err);
      setNotifStatus("error");
    }
  };

  const handleTest = () => {
    try {
      const notif = new Notification("Test Notification", {
        body: "If you see this, notifications are working!",
      });
      notif.onclick = () => {
        window.focus();
      };
    } catch (err) {
      console.error("Notification error:", err);
      alert("Failed to send notification: " + err);
    }
  };

  const handleSendToday = async () => {
    const today = new Date().toISOString().split("T")[0];
    
    try {
      const [habitsRes, assignmentsRes, errandsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch(`/api/assignments?from=${today}&to=${today}`),
        fetch(`/api/errands?from=${today}&to=${today}`),
      ]);

      const habits = await habitsRes.json();
      const assignments = await assignmentsRes.json();
      const errands = await errandsRes.json();

      const dayOfWeek = new Date().getDay();
      const todayHabits = habits.filter((h: { isTemplate: boolean; days: string }) => {
        if (!h.isTemplate) return false;
        return h.days.split(",").map(Number).includes(dayOfWeek);
      });
      const pendingAssignments = assignments.filter((a: { completed: boolean }) => !a.completed);
      const pendingErrands = errands.filter((e: { completed: boolean }) => !e.completed);

      const lines = [];
      if (todayHabits.length > 0) lines.push(`Habits: ${todayHabits.map((h: {icon: string; name: string}) => h.icon + " " + h.name).join(", ")}`);
      if (pendingAssignments.length > 0) lines.push(`Assignments: ${pendingAssignments.map((a: {icon: string; name: string}) => a.icon + " " + a.name).join(", ")}`);
      if (pendingErrands.length > 0) lines.push(`Errands: ${pendingErrands.map((e: {icon: string; name: string; time: string | null}) => e.icon + " " + e.name + (e.time ? " at " + e.time : "")).join(", ")}`);

      const body = lines.length > 0 ? lines.join("\n") : "No tasks for today!";

      new Notification("Today's Overview", { body });
    } catch (err) {
      console.error("Error:", err);
      alert("Error: " + err);
    }
  };

  const exportData = async () => {
    const [habitsRes, entriesRes] = await Promise.all([
      fetch("/api/habits?archived=true"),
      fetch("/api/entries?from=2020-01-01&to=2099-12-31"),
    ]);
    const habits = await habitsRes.json();
    const entries = await entriesRes.json();

    const data = { habits, entries, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit-tracker-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = async () => {
    // Delete all habits
    const habitsRes = await fetch("/api/habits?archived=true");
    const habits = await habitsRes.json();
    for (const h of habits) {
      await fetch(`/api/habits/${h.id}`, { method: "DELETE" });
    }

    // Delete all assignments
    const assignmentsRes = await fetch("/api/assignments?archived=true");
    const assignments = await assignmentsRes.json();
    for (const a of assignments) {
      await fetch(`/api/assignments/${a.id}`, { method: "DELETE" });
    }

    // Delete all errands
    const errandsRes = await fetch("/api/errands?archived=true");
    const errands = await errandsRes.json();
    for (const e of errands) {
      await fetch(`/api/errands/${e.id}`, { method: "DELETE" });
    }

    setResetConfirm(false);
    window.location.reload();
  };

  if (!mounted) return null;

  const themes = [
    { 
      value: "light", 
      label: "Light", 
      icon: Sun,
      desc: "Clean & bright",
      colors: ["#ffffff", "#f5f5f5", "#6366f1"]
    },
    { 
      value: "dark", 
      label: "Dark", 
      icon: Moon,
      desc: "Easy on the eyes",
      colors: ["#1a1a2e", "#252540", "#a78bfa"]
    },
    { 
      value: "grey", 
      label: "Grey", 
      icon: Cloud,
      desc: "Neutral & calm",
      colors: ["#3d3d4e", "#4a4a5c", "#5eead4"]
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Settings</h1>

      <div className="space-y-8">
        {/* Theme */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appearance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {themes.map(({ value, label, icon: Icon, desc, colors }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-3 p-5 rounded-xl border transition-all",
                  theme === value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-muted hover:border-foreground/20"
                )}
              >
                <div className="w-full h-16 rounded-lg overflow-hidden flex gap-0.5">
                  {colors.map((color, i) => (
                    <div 
                      key={i} 
                      className="flex-1" 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Notifications</h2>
          <div className="rounded-xl border bg-card p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Status: {notifStatus}</p>
                <p className="text-sm text-muted-foreground">
                  {notifStatus === "granted" ? "Ready to send notifications" : 
                   notifStatus === "denied" ? "Blocked — check browser settings" :
                   notifStatus === "not supported" ? "Browser doesn't support notifications" :
                   "Click enable below"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {notifStatus !== "granted" && (
                <Button onClick={handleEnable} className="w-full gap-2">
                  <Bell className="h-4 w-4" />
                  Enable Notifications
                </Button>
              )}
              
              {notifStatus === "granted" && (
                <>
                  <Button onClick={handleTest} variant="outline" className="w-full gap-2">
                    <Zap className="h-4 w-4" />
                    Test Notification
                  </Button>
                  <Button onClick={handleSendToday} variant="secondary" className="w-full gap-2">
                    <Bell className="h-4 w-4" />
                    Send Today&apos;s Overview
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Data</h2>
          <div className="space-y-2">
            <Button onClick={exportData} variant="outline" className="w-full justify-start gap-3">
              <Download className="h-4 w-4" />
              Export Data (JSON)
            </Button>
            <Button 
              onClick={async () => {
                const { exportAllData } = await import("@/lib/csv");
                exportAllData();
              }} 
              variant="outline" 
              className="w-full justify-start gap-3"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export as CSV (Sheets)
            </Button>
            <Button
              onClick={() => setResetConfirm(true)}
              variant="outline"
              className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>
        </section>

        {/* Info */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">About</h2>
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground space-y-1">
            <p>Habit Tracker v1.0</p>
            <p>Built with Next.js, Tailwind CSS, Prisma, Framer Motion</p>
          </div>
        </section>
      </div>

      {/* Reset Confirmation */}
      <Dialog open={resetConfirm} onOpenChange={(v) => !v && setResetConfirm(false)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Clear All Data?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all habits and entries. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={clearAllData}>Clear Everything</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
