"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HealthBar } from "@/components/rpg/HealthBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExternalLink, Clock, Swords, ArrowRight } from "lucide-react";
import type { SiteStatus } from "@/types";

interface SitesListProps {
  sites: SiteStatus[];
}

export function SitesList({ sites }: SitesListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sites.map((site, i) => (
        <motion.div
          key={site.id}
          className={cn(
            "rpg-card p-5 transition-all hover:border-gold/30",
            site.isUp ? "rpg-glow-green" : "rpg-glow-red"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{site.icon}</span>
              <div>
                <h3
                  className="font-bold text-parchment"
                  style={{ fontFamily: "var(--font-medieval)" }}
                >
                  {site.villageName}
                </h3>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-mana-blue hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  {site.name}
                </a>
              </div>
            </div>
            <Badge variant={site.isUp ? "success" : "danger"}>
              {site.isUp ? "Aktif" : "Düşmüş"}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2 text-parchment-dim">
              <Clock className="w-4 h-4" />
              <span>Yanıt: <span className="text-parchment font-medium">{site.lastResponseTime}ms</span></span>
            </div>
            <div className="flex items-center gap-2 text-parchment-dim">
              <Swords className="w-4 h-4" />
              <span>Uptime: <span className="text-parchment font-medium">{site.uptimePercentage.toFixed(1)}%</span></span>
            </div>
          </div>

          {/* Health Bar */}
          <HealthBar
            percentage={site.uptimePercentage}
            label="24 Saat Uptime"
            showValue
            size="md"
            className="mb-4"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <Link href={`/sites/${site.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Detaylar
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
