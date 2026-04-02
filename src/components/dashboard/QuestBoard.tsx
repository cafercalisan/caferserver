"use client";

import { QuestCard } from "@/components/rpg/QuestCard";
import type { DeploymentInfo } from "@/types";

interface QuestBoardProps {
  deployments: DeploymentInfo[];
}

export function QuestBoard({ deployments }: QuestBoardProps) {
  return (
    <div className="rpg-card p-4">
      <h3
        className="text-sm font-bold text-gold mb-3"
        style={{ fontFamily: "var(--font-medieval)" }}
      >
        Görev Tahtası
      </h3>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {deployments.length === 0 && (
          <p className="text-xs text-parchment-dim text-center py-4">
            Henüz görev yok
          </p>
        )}
        {deployments.map((deployment) => (
          <QuestCard key={deployment.id} deployment={deployment} />
        ))}
      </div>
    </div>
  );
}
