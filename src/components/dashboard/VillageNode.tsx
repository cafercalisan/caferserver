"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HealthBar } from "@/components/rpg/HealthBar";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink, Clock } from "lucide-react";
import type { SiteStatus } from "@/types";

interface VillageNodeProps {
  site: SiteStatus;
}

export function VillageNode({ site }: VillageNodeProps) {
  return (
    <Link href={`/sites/${site.id}`}>
      <motion.div
        className={cn(
          "rpg-card p-4 w-full md:w-48 cursor-pointer transition-all hover:border-gold/30",
          site.isUp ? "rpg-glow-green" : "rpg-glow-red"
        )}
        whileHover={{ scale: 1.05, y: -2 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{site.icon}</span>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-parchment text-sm truncate" style={{ fontFamily: "var(--font-medieval)" }}>
              {site.villageName}
            </h4>
            <div className="flex items-center gap-1 text-xs text-parchment-dim">
              <ExternalLink className="w-3 h-3" />
              <span className="truncate">{site.name}</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant={site.isUp ? "success" : "danger"}>
            {site.isUp ? "Aktif" : "Düşmüş"}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-parchment-dim">
            <Clock className="w-3 h-3" />
            <span>{site.lastResponseTime}ms</span>
          </div>
        </div>

        {/* Health bar */}
        <HealthBar
          percentage={site.uptimePercentage}
          size="sm"
        />
      </motion.div>
    </Link>
  );
}
