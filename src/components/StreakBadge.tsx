"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  current: number;
  longest: number;
  size?: "sm" | "md" | "lg";
  showLongest?: boolean;
}

export function StreakBadge({ current, longest, size = "sm", showLongest = false }: StreakBadgeProps) {
  if (current === 0 && !showLongest) return null;

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-0.5",
    md: "text-sm px-2 py-1 gap-1",
    lg: "text-base px-3 py-1.5 gap-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 100) return "text-purple-500 bg-purple-500/10 border-purple-500/20";
    if (streak >= 30) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    if (streak >= 7) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    if (streak >= 3) return "text-green-500 bg-green-500/10 border-green-500/20";
    return "text-muted-foreground bg-muted border-muted";
  };

  return (
    <div className="flex items-center gap-1.5">
      {current > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "flex items-center rounded-full border font-medium",
            sizeClasses[size],
            getStreakColor(current)
          )}
        >
          <Flame className={cn(iconSizes[size], current >= 7 && "animate-pulse")} />
          <span>{current}</span>
        </motion.div>
      )}
      {showLongest && longest > current && (
        <span className="text-[10px] text-muted-foreground">
          Best: {longest}
        </span>
      )}
    </div>
  );
}
