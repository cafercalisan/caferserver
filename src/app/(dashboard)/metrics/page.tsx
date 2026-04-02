import { prisma } from "@/lib/db";
import { MetricsView } from "./MetricsView";

export default async function MetricsPage() {
  const metrics = await prisma.serverMetric.findMany({
    orderBy: { recordedAt: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold rpg-gradient-text"
          style={{ fontFamily: "var(--font-medieval)" }}
        >
          Kale Metrikleri
        </h1>
        <p className="text-sm text-parchment-dim mt-1">
          Sunucu performans verileri
        </p>
      </div>
      <MetricsView
        initialMetrics={metrics.map((m) => ({
          cpuUsage: m.cpuUsage,
          ramUsage: m.ramUsage,
          ramTotal: m.ramTotal,
          diskUsage: m.diskUsage,
          diskTotal: m.diskTotal,
          networkIn: m.networkIn,
          networkOut: m.networkOut,
          recordedAt: m.recordedAt.toISOString(),
        }))}
      />
    </div>
  );
}
