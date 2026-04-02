"use client";

import { motion } from "framer-motion";
import { formatDateTime } from "@/lib/utils";
import type { ActivityLogEntry } from "@/types";
import {
  Sword,
  Shield,
  AlertTriangle,
  Trophy,
  Server,
  ArrowUpCircle,
} from "lucide-react";

const typeIcons: Record<string, typeof Sword> = {
  deploy: Sword,
  alert: AlertTriangle,
  achievement: Trophy,
  system: Server,
  level_up: ArrowUpCircle,
  recovery: Shield,
};

interface ActivityFeedProps {
  activities: ActivityLogEntry[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="rpg-card p-4">
      <h3
        className="text-sm font-bold text-gold mb-3"
        style={{ fontFamily: "var(--font-medieval)" }}
      >
        Krallık Günlüğü
      </h3>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {activities.length === 0 && (
          <p className="text-xs text-parchment-dim text-center py-4">
            Henüz kayıt yok
          </p>
        )}
        {activities.map((activity, i) => {
          const Icon = typeIcons[activity.type] || Server;
          return (
            <motion.div
              key={activity.id}
              className="flex items-start gap-3 text-xs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Icon className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-parchment">{activity.message}</p>
                <p className="text-parchment-dim/60 mt-0.5">
                  {formatDateTime(activity.createdAt)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
