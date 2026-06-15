"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
  color,
  bgColor,
  showLabel = true,
  label,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (color) return color;
    if (percentage === 100) return "#22c55e";
    if (percentage >= 75) return "#10b981";
    if (percentage >= 50) return "#f59e0b";
    if (percentage >= 25) return "#f97316";
    return "#ef4444";
  };

  // Dynamic font size based on ring size
  const fontSize = size <= 40 ? 9 : size <= 60 ? 12 : 16;
  const labelSize = size <= 40 ? 6 : 8;

  return (
    <div className={cn("relative inline-flex items-center justify-center flex-shrink-0", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor || "hsl(var(--muted))"}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span style={{ fontSize: `${fontSize}px` }} className="font-bold">{percentage}%</span>
          {label && <span style={{ fontSize: `${labelSize}px` }} className="text-muted-foreground mt-0.5">{label}</span>}
        </div>
      )}
    </div>
  );
}
