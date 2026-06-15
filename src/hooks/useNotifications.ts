"use client";

import { useEffect, useCallback, useState } from "react";

interface NotificationItem {
  id: string;
  name: string;
  icon: string;
  type: "habit" | "assignment" | "errand";
  time?: string | null;
  dueDate?: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      const stored = localStorage.getItem("notifications-enabled");
      setEnabled(stored === "true");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("Notifications not supported");
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === "granted") {
      setEnabled(true);
      localStorage.setItem("notifications-enabled", "true");
      return true;
    }
    return false;
  }, []);

  const disableNotifications = useCallback(() => {
    setEnabled(false);
    localStorage.setItem("notifications-enabled", "false");
  }, []);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!enabled || permission !== "granted") return;

    try {
      new Notification(title, {
        icon: "/icon.png",
        badge: "/icon.png",
        ...options,
      });
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  }, [enabled, permission]);

  const sendTaskNotifications = useCallback((items: NotificationItem[]) => {
    if (!enabled || permission !== "granted" || items.length === 0) return;

    const habits = items.filter(i => i.type === "habit");
    const assignments = items.filter(i => i.type === "assignment");
    const errands = items.filter(i => i.type === "errand");

    if (habits.length > 0) {
      sendNotification(`${habits.length} Habit${habits.length > 1 ? 's' : ''} Today`, {
        body: habits.map(h => `${h.icon} ${h.name}`).join("\n"),
        tag: "habits-today",
      });
    }

    if (assignments.length > 0) {
      sendNotification(`${assignments.length} Assignment${assignments.length > 1 ? 's' : ''}`, {
        body: assignments.map(a => `${a.icon} ${a.name}${a.dueDate ? ` (Due: ${a.dueDate})` : ''}`).join("\n"),
        tag: "assignments-today",
      });
    }

    if (errands.length > 0) {
      const withTime = errands.filter(e => e.time);
      const withoutTime = errands.filter(e => !e.time);

      if (withTime.length > 0) {
        sendNotification(`${withTime.length} Errand${withTime.length > 1 ? 's' : ''} with Time`, {
          body: withTime.map(e => `${e.icon} ${e.name} at ${e.time}`).join("\n"),
          tag: "errands-time",
        });
      }

      if (withoutTime.length > 0) {
        sendNotification(`${withoutTime.length} Errand${withoutTime.length > 1 ? 's' : ''} Today`, {
          body: withoutTime.map(e => `${e.icon} ${e.name}`).join("\n"),
          tag: "errands-today",
        });
      }
    }
  }, [enabled, permission, sendNotification]);

  return {
    permission,
    enabled,
    requestPermission,
    disableNotifications,
    sendNotification,
    sendTaskNotifications,
  };
}
