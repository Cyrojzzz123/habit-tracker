"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronUp, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function TimePicker({ value, onChange, label, className }: TimePickerProps) {
  const [expanded, setExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const parseTime = useCallback((val: string) => {
    if (!val) return { hour: 12, minute: 0, period: "AM" as const };
    const [h, m] = val.split(":").map(Number);
    if (h === 0) return { hour: 12, minute: m, period: "AM" as const };
    if (h < 12) return { hour: h, minute: m, period: "AM" as const };
    if (h === 12) return { hour: 12, minute: m, period: "PM" as const };
    return { hour: h - 12, minute: m, period: "PM" as const };
  }, []);

  const formatDisplay = useCallback((h: number, m: number, p: string) => {
    return `${h}:${m.toString().padStart(2, "0")} ${p}`;
  }, []);

  const to24Hour = useCallback((h: number, m: number, p: string) => {
    let hour24 = h;
    if (p === "AM" && h === 12) hour24 = 0;
    else if (p === "PM" && h !== 12) hour24 = h + 12;
    return `${hour24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    const { hour, minute, period } = parseTime(value);
    setInputValue(formatDisplay(hour, minute, period));
  }, [value, parseTime, formatDisplay]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const match = val.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      const h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const p = match[3]?.toUpperCase() || "AM";
      if (h >= 1 && h <= 12 && m >= 0 && m < 60) {
        onChange(to24Hour(h, m, p));
      }
    }
  };

  const adjustHour = (delta: number) => {
    const { hour, minute, period } = parseTime(value);
    const newHour = ((hour + delta + 12 - 1) % 12) + 1;
    onChange(to24Hour(newHour, minute, period));
  };

  const adjustMinute = (delta: number) => {
    const { hour, minute, period } = parseTime(value);
    const newMinute = (minute + delta + 60) % 60;
    onChange(to24Hour(hour, newMinute, period));
  };

  const togglePeriod = () => {
    const { hour, minute, period } = parseTime(value);
    const newPeriod = period === "AM" ? "PM" : "AM";
    onChange(to24Hour(hour, minute, newPeriod));
  };

  const { hour, minute, period } = parseTime(value);

  return (
    <div className={cn("space-y-1", className)} ref={containerRef}>
      {label && <label className="text-xs text-muted-foreground">{label}</label>}
      <div className="relative">
        <div className="flex items-center gap-1 border rounded-md px-2 py-1.5 bg-background">
          <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setExpanded(true)}
            placeholder="12:00 AM"
            className="flex-1 text-sm bg-transparent outline-none min-w-0"
          />
          <button type="button" onClick={() => setExpanded(!expanded)} className="p-0.5 hover:bg-muted rounded">
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>

        {expanded && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 p-3">
            <div className="flex items-center justify-center gap-3">
              {/* Hour */}
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={() => adjustHour(1)} className="p-1 hover:bg-muted rounded">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="text-lg font-mono font-bold w-8 text-center">{hour}</span>
                <button type="button" onClick={() => adjustHour(-1)} className="p-1 hover:bg-muted rounded">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <span className="text-lg font-bold">:</span>

              {/* Minute */}
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={() => adjustMinute(5)} className="p-1 hover:bg-muted rounded">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <span className="text-lg font-mono font-bold w-8 text-center">{minute.toString().padStart(2, "0")}</span>
                <button type="button" onClick={() => adjustMinute(-5)} className="p-1 hover:bg-muted rounded">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* AM/PM */}
              <button
                type="button"
                onClick={togglePeriod}
                className="px-3 py-2 text-sm font-bold bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {period}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
