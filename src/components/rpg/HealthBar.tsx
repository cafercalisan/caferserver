"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HealthBarProps {
  percentage: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function getHealthColor(percentage: number): string {
  if (percentage >= 90) return "from-health-green/80 to-health-green";
  if (percentage >= 50) return "from-health-yellow/80 to-health-yellow";
  return "from-health-red/80 to-health-red";
}

function getGlowClass(percentage: number): string {
  if (percentage >= 90) return "rpg-glow-green";
  if (percentage >= 50) return "";
  return "rpg-glow-red";
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function HealthBar({ percentage, label, showValue, className, size = "md" }: HealthBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs text-parchment-dim mb-1">
          {label && <span>{label}</span>}
          {showValue && <span>{clamped.toFixed(1)}%</span>}
        </div>
      )}
      <div className={cn("health-bar-bg", sizeMap[size], getGlowClass(clamped))}>
        <motion.div
          className={cn("h-full bg-gradient-to-r rounded-full", getHealthColor(clamped))}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
