"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface XPBarProps {
  current: number;
  needed: number;
  percentage: number;
  level: number;
  className?: string;
  compact?: boolean;
}

export function XPBar({ current, needed, percentage, level, className, compact }: XPBarProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs font-bold shrink-0">
        {level}
      </div>
      <div className="flex-1 min-w-0">
        {!compact && (
          <div className="flex justify-between text-xs text-parchment-dim mb-1">
            <span>XP</span>
            <span>{current} / {needed}</span>
          </div>
        )}
        <div className="health-bar-bg h-2.5">
          <motion.div
            className="h-full bg-gradient-to-r from-gold-dim to-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
