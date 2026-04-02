"use client";

import Link from "next/link";
import { ScrollText, Swords, Trophy, Skull, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestStats } from "@/types";

interface QuestSummaryWidgetProps {
  stats: QuestStats;
}

export function QuestSummaryWidget({ stats }: QuestSummaryWidgetProps) {
  const items = [
    { label: "Açık", value: stats.byStatus.open, icon: ScrollText, color: "text-health-yellow" },
    { label: "Devam Eden", value: stats.byStatus.in_progress, icon: Swords, color: "text-mana-blue" },
    { label: "Tamamlanan", value: stats.byStatus.completed, icon: Trophy, color: "text-health-green" },
    { label: "Geciken", value: stats.overdue, icon: Skull, color: "text-health-red" },
  ];

  return (
    <div className="rpg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-bold text-gold"
          style={{ fontFamily: "var(--font-medieval)" }}
        >
          Görev Loncası
        </h3>
        <Link href="/quests" className="text-xs text-gold/70 hover:text-gold transition-colors">
          Tümünü Gör
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-castle-border/20">
            <item.icon className={cn("w-4 h-4", item.color)} />
            <div>
              <span className={cn("text-lg font-bold", item.color)}>{item.value}</span>
              <span className="text-xs text-parchment-dim ml-1">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      {stats.totalXpFromQuests > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gold/5 border border-gold/20">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-sm text-gold font-semibold">
            {stats.totalXpFromQuests} XP
          </span>
          <span className="text-xs text-parchment-dim">görevlerden kazanıldı</span>
        </div>
      )}

      {stats.byStatus.open + stats.byStatus.in_progress > 0 && (
        <Link href="/quests?status=open">
          <div className="mt-3 text-center py-2 rounded-lg bg-gold/10 hover:bg-gold/20 transition-all text-xs text-gold font-medium cursor-pointer">
            {stats.byStatus.open + stats.byStatus.in_progress} görev bekliyor
          </div>
        </Link>
      )}
    </div>
  );
}
