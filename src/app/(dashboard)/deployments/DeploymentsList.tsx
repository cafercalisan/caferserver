"use client";

import { motion } from "framer-motion";
import { QuestCard } from "@/components/rpg/QuestCard";
import type { DeploymentInfo } from "@/types";

interface DeploymentsListProps {
  deployments: DeploymentInfo[];
}

export function DeploymentsList({ deployments }: DeploymentsListProps) {
  if (deployments.length === 0) {
    return (
      <div className="rpg-card p-12 text-center">
        <p className="text-4xl mb-3">⚔️</p>
        <p className="text-parchment-dim">Henüz hiç görev tamamlanmadı</p>
        <p className="text-xs text-parchment-dim/60 mt-1">
          Bir siteyi deploy ederek ilk görevini başlat
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {deployments.map((deployment, i) => (
        <motion.div
          key={deployment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <QuestCard deployment={deployment} />
        </motion.div>
      ))}
    </div>
  );
}
