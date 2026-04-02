"use client";

import { motion } from "framer-motion";
import { VillageNode } from "./VillageNode";
import { CastleStatus } from "./CastleStatus";
import type { SiteStatus, ServerMetrics } from "@/types";

interface CastleMapProps {
  sites: SiteStatus[];
  serverMetrics: ServerMetrics | null;
}

const villagePositions = [
  { x: 20, y: 15 },  // top-left
  { x: 75, y: 15 },  // top-right
  { x: 15, y: 70 },  // bottom-left
  { x: 80, y: 70 },  // bottom-right
];

export function CastleMap({ sites, serverMetrics }: CastleMapProps) {
  return (
    <>
      {/* Desktop: SVG Map */}
      <div className="hidden md:block relative w-full aspect-[16/10] rpg-card overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(240,192,64,0.03),transparent_70%)]" />

        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {/* Roads from castle to villages */}
          {villagePositions.map((pos, i) => (
            <motion.line
              key={`road-${i}`}
              x1="50"
              y1="50"
              x2={pos.x}
              y2={pos.y}
              stroke="rgba(160, 128, 48, 0.3)"
              strokeWidth="0.5"
              strokeDasharray="2 1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: i * 0.2 }}
            />
          ))}
        </svg>

        {/* Castle at center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <CastleStatus metrics={serverMetrics} />
        </div>

        {/* Villages at positions */}
        {sites.map((site, i) => {
          const pos = villagePositions[i] || { x: 50, y: 50 };
          return (
            <motion.div
              key={site.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.15, type: "spring", stiffness: 200 }}
            >
              <VillageNode site={site} />
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: Card List */}
      <div className="md:hidden space-y-4">
        <CastleStatus metrics={serverMetrics} />
        {sites.map((site, i) => (
          <motion.div
            key={site.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <VillageNode site={site} />
          </motion.div>
        ))}
      </div>
    </>
  );
}
