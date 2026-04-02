"use client";

import { motion } from "framer-motion";
import { Castle, Cpu, HardDrive, MemoryStick } from "lucide-react";
import { HealthBar } from "@/components/rpg/HealthBar";
import type { ServerMetrics } from "@/types";

interface CastleStatusProps {
  metrics: ServerMetrics | null;
}

export function CastleStatus({ metrics }: CastleStatusProps) {
  const overallHealth = metrics
    ? Math.max(0, 100 - (metrics.cpuUsage * 0.4 + metrics.ramUsage * 0.3 + metrics.diskUsage * 0.3))
    : 0;

  return (
    <motion.div
      className="rpg-card-gold p-4 md:p-5 w-full md:w-56"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center rpg-glow-gold">
          <Castle className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-bold text-parchment text-sm" style={{ fontFamily: "var(--font-medieval)" }}>
            Ana Kale
          </h3>
          <p className="text-xs text-parchment-dim">Hetzner Sunucu</p>
        </div>
      </div>

      <HealthBar percentage={overallHealth} label="Kale Sağlığı" showValue size="md" />

      {metrics ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Cpu className="w-3.5 h-3.5 text-mana-blue" />
            <span className="text-parchment-dim flex-1">CPU</span>
            <span className="text-parchment font-medium">{metrics.cpuUsage.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <MemoryStick className="w-3.5 h-3.5 text-village-library" />
            <span className="text-parchment-dim flex-1">RAM</span>
            <span className="text-parchment font-medium">{metrics.ramUsage.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <HardDrive className="w-3.5 h-3.5 text-village-inn" />
            <span className="text-parchment-dim flex-1">Disk</span>
            <span className="text-parchment font-medium">{metrics.diskUsage.toFixed(1)}%</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-parchment-dim mt-3">Metrikler yükleniyor...</p>
      )}
    </motion.div>
  );
}
