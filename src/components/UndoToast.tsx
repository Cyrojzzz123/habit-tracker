"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UndoAction {
  id: string;
  message: string;
  onUndo: () => void;
  timeout?: number;
}

let undoCallback: ((action: UndoAction) => void) | null = null;

export function showUndoToast(action: Omit<UndoAction, "id">) {
  if (undoCallback) {
    undoCallback({
      ...action,
      id: Date.now().toString(),
      timeout: action.timeout || 5000,
    });
  }
}

export function UndoToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(UndoAction & { visible: boolean })[]>([]);

  const addToast = useCallback((action: UndoAction) => {
    const toast = { ...action, visible: true };
    setToasts((prev) => [...prev, toast]);

    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === action.id ? { ...t, visible: false } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== action.id));
      }, 300);
    }, action.timeout || 5000);
  }, []);

  useEffect(() => {
    undoCallback = addToast;
    return () => {
      undoCallback = null;
    };
  }, [addToast]);

  const handleUndo = (toast: UndoAction) => {
    toast.onUndo();
    setToasts((prev) =>
      prev.map((t) => (t.id === toast.id ? { ...t, visible: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 300);
  };

  const dismiss = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  return (
    <>
      {children}
      <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.filter((t) => t.visible).map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="flex items-center gap-3 px-4 py-3 bg-card border rounded-xl shadow-lg"
            >
              <span className="text-sm">{toast.message}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUndo(toast)}
                className="gap-1.5"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Undo
              </Button>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
