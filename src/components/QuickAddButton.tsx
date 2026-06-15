"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ListTodo, ClipboardList, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function QuickAddButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const options = [
    { label: "Habit", icon: ListTodo, href: "/habits", color: "bg-blue-500" },
    { label: "Assignment", icon: ClipboardList, href: "/assignments", color: "bg-orange-500" },
    { label: "Errand", icon: MapPin, href: "/errands", color: "bg-amber-500" },
  ];

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-2 mb-3 items-end"
          >
            {options.map((opt, i) => (
              <motion.button
                key={opt.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  router.push(opt.href);
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border shadow-lg hover:shadow-xl transition-shadow"
              >
                <span className="text-sm font-medium">{opt.label}</span>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", opt.color)}>
                  <opt.icon className="w-4 h-4" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors",
          open
            ? "bg-red-500 hover:bg-red-600"
            : "bg-primary hover:bg-primary/90"
        )}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}
