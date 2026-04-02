"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Achievement } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const isUnlocked = !!achievement.unlockedAt;

  return (
    <motion.div
      className={cn(
        "rpg-card p-4 flex items-center gap-4 transition-all",
        isUnlocked ? "rpg-glow-gold" : "opacity-50 grayscale"
      )}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="text-3xl">{achievement.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-parchment truncate">{achievement.name}</h4>
          {isUnlocked && <Badge variant="success">Açıldı</Badge>}
        </div>
        <p className="text-xs text-parchment-dim mt-0.5">{achievement.description}</p>
      </div>
      <div className="text-gold text-sm font-bold shrink-0">+{achievement.xpReward} XP</div>
    </motion.div>
  );
}
