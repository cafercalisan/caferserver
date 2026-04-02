"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { DeploymentInfo } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Sword, CheckCircle, XCircle, Loader2 } from "lucide-react";

const statusConfig = {
  pending: { badge: "warning" as const, icon: Loader2, label: "Hazırlanıyor" },
  building: { badge: "info" as const, icon: Sword, label: "İnşa Ediliyor" },
  success: { badge: "success" as const, icon: CheckCircle, label: "Başarılı" },
  failed: { badge: "danger" as const, icon: XCircle, label: "Başarısız" },
};

interface QuestCardProps {
  deployment: DeploymentInfo;
}

export function QuestCard({ deployment }: QuestCardProps) {
  const config = statusConfig[deployment.status];
  const Icon = config.icon;

  return (
    <motion.div
      className={cn(
        "rpg-card p-4",
        deployment.status === "success" && "rpg-glow-green",
        deployment.status === "failed" && "rpg-glow-red"
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={cn(
              "w-5 h-5 shrink-0",
              deployment.status === "building" && "animate-spin",
              deployment.status === "success" && "text-health-green",
              deployment.status === "failed" && "text-health-red",
              deployment.status === "pending" && "text-health-yellow animate-spin"
            )}
          />
          <div className="min-w-0">
            <h4 className="font-medium text-parchment text-sm truncate">
              {deployment.questName}
            </h4>
            <p className="text-xs text-parchment-dim mt-0.5">
              {deployment.villageName}
            </p>
          </div>
        </div>
        <Badge variant={config.badge}>{config.label}</Badge>
      </div>
      <div className="flex items-center justify-between mt-3 text-xs text-parchment-dim">
        <span>{formatDateTime(deployment.triggeredAt)}</span>
        {deployment.xpAwarded > 0 && (
          <span className="text-gold font-semibold">+{deployment.xpAwarded} XP</span>
        )}
      </div>
    </motion.div>
  );
}
