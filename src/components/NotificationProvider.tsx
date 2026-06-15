"use client";

import { useEffect, useCallback, useState } from "react";
import { formatDate } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

interface Habit {
  id: string;
  name: string;
  icon: string;
  days: string;
  isTemplate: boolean;
}

interface Assignment {
  id: string;
  name: string;
  icon: string;
  dueDate: string;
  completed: boolean;
}

interface Errand {
  id: string;
  name: string;
  icon: string;
  date: string;
  time: string | null;
  completed: boolean;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { enabled, sendTaskNotifications } = useNotifications();
  const [lastChecked, setLastChecked] = useState<string>("");

  const checkAndNotify = useCallback(async () => {
    const today = formatDate(new Date());
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Only check once per minute
    const checkKey = `${today}-${currentHour}-${currentMinute}`;
    if (checkKey === lastChecked) return;
    setLastChecked(checkKey);

    try {
      const [habitsRes, assignmentsRes, errandsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch(`/api/assignments?from=${today}&to=${today}`),
        fetch(`/api/errands?from=${today}&to=${today}`),
      ]);

      const habits: Habit[] = await habitsRes.json();
      const assignments: Assignment[] = await assignmentsRes.json();
      const errands: Errand[] = await errandsRes.json();

      const dayOfWeek = now.getDay();

      // Get today's habits
      const todayHabits = habits.filter(h => {
        if (!h.isTemplate) return false;
        const days = h.days.split(",").map(Number);
        return days.includes(dayOfWeek);
      });

      // Get incomplete assignments due today
      const todayAssignments = assignments.filter(a => !a.completed);

      // Get incomplete errands for today
      const todayErrands = errands.filter(e => !e.completed);

      // Build notification items
      const items = [
        ...todayHabits.map(h => ({
          id: h.id,
          name: h.name,
          icon: h.icon,
          type: "habit" as const,
        })),
        ...todayAssignments.map(a => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
          type: "assignment" as const,
          dueDate: a.dueDate,
        })),
        ...todayErrands.map(e => ({
          id: e.id,
          name: e.name,
          icon: e.icon,
          type: "errand" as const,
          time: e.time,
        })),
      ];

      if (items.length > 0) {
        sendTaskNotifications(items);
      }
    } catch (err) {
      console.error("Failed to check notifications:", err);
    }
  }, [lastChecked, sendTaskNotifications]);

  useEffect(() => {
    if (!enabled) return;

    // Check immediately
    checkAndNotify();

    // Check every minute
    const interval = setInterval(checkAndNotify, 60000);

    return () => clearInterval(interval);
  }, [enabled, checkAndNotify]);

  // Also check when page becomes visible
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndNotify();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, checkAndNotify]);

  return <>{children}</>;
}
