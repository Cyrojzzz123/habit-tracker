"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Clock, Calendar, FileText } from "lucide-react";

interface HoverInfoProps {
  children: React.ReactNode;
  name: string;
  description?: string | null;
  note?: string | null;
  time?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  dueDate?: string | null;
  daysUntil?: number | null;
  color?: string;
  icon?: string;
}

export function HoverInfo({
  children,
  name,
  description,
  note,
  time,
  startTime,
  endTime,
  dueDate,
  daysUntil,
  color,
  icon,
}: HoverInfoProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [showAbove, setShowAbove] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const above = rect.top > viewportH * 0.6;
        setShowAbove(above);
        setPos({
          x: rect.left + rect.width / 2,
          y: above ? rect.top : rect.bottom,
        });
      }
      setShow(true);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(false), 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const hasDetails = description || note || time || startTime || endTime || dueDate;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {typeof window !== "undefined" && show && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: pos.x,
            top: showAbove ? pos.y - 8 : pos.y + 8,
            transform: `translate(-50%, ${showAbove ? "-100%" : "0%"})`,
          }}
        >
          <div className="bg-popover border rounded-xl shadow-2xl p-3 max-w-[220px] text-left animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1.5">
              {icon && <span className="text-base">{icon}</span>}
              <p className="font-semibold text-sm leading-tight">{name}</p>
            </div>

            {color && (
              <div className="w-full h-1 rounded-full mb-2" style={{ backgroundColor: color }} />
            )}

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground mb-1.5 leading-relaxed">{description}</p>
            )}

            {/* Note */}
            {note && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-1.5">
                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{note}</span>
              </div>
            )}

            {/* Time */}
            {time && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{time}</span>
              </div>
            )}

            {/* Start/End Time */}
            {startTime && endTime && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{startTime} — {endTime}</span>
              </div>
            )}

            {/* Due Date */}
            {dueDate && (
              <div className="flex items-center gap-1.5 text-xs mt-1">
                <Calendar className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                <span className={cn(
                  "font-medium",
                  daysUntil !== null && daysUntil !== undefined && daysUntil < 0 ? "text-red-500" :
                  daysUntil === 0 ? "text-orange-500" :
                  "text-muted-foreground"
                )}>
                  Due: {dueDate}
                  {daysUntil !== null && daysUntil !== undefined && (
                    daysUntil < 0 ? ` (${Math.abs(daysUntil)}d overdue)` :
                    daysUntil === 0 ? " (today)" :
                    ` (${daysUntil}d left)`
                  )}
                </span>
              </div>
            )}

            {!hasDetails && (
              <p className="text-[10px] text-muted-foreground italic">No additional details</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
