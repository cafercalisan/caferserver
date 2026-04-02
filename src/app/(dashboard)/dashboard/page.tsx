import { prisma } from "@/lib/db";
import { CastleMap } from "@/components/dashboard/CastleMap";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuestBoard } from "@/components/dashboard/QuestBoard";
import { QuestSummaryWidget } from "@/components/dashboard/QuestSummaryWidget";
import type { SiteStatus, DeploymentInfo, ActivityLogEntry, QuestStats } from "@/types";

export default async function DashboardPage() {
  const [sites, recentDeployments, recentActivity, questStatsData] = await Promise.all([
    prisma.site.findMany({
      orderBy: { order: "asc" },
      include: {
        healthChecks: {
          orderBy: { checkedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.deployment.findMany({
      orderBy: { triggeredAt: "desc" },
      take: 5,
      include: { site: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    Promise.all([
      prisma.quest.count(),
      prisma.quest.count({ where: { status: "open" } }),
      prisma.quest.count({ where: { status: "in_progress" } }),
      prisma.quest.count({ where: { status: "completed" } }),
      prisma.quest.count({ where: { status: "failed" } }),
      prisma.quest.count({
        where: { status: { in: ["open", "in_progress"] }, dueDate: { lt: new Date() } },
      }),
      prisma.quest.aggregate({
        _sum: { xpReward: true },
        where: { status: "completed", xpAwarded: true },
      }),
    ]),
  ]);

  // Calculate uptime percentage (last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const uptimeData = await Promise.all(
    sites.map(async (site) => {
      const checks = await prisma.healthCheck.findMany({
        where: { siteId: site.id, checkedAt: { gte: oneDayAgo } },
        select: { isUp: true },
      });
      const total = checks.length;
      const up = checks.filter((c) => c.isUp).length;
      return { siteId: site.id, percentage: total > 0 ? (up / total) * 100 : 100 };
    })
  );

  const siteStatuses: SiteStatus[] = sites.map((site) => {
    const lastCheck = site.healthChecks[0];
    const uptime = uptimeData.find((u) => u.siteId === site.id);
    return {
      id: site.id,
      name: site.name,
      url: site.url,
      villageName: site.villageName,
      villageType: site.villageType,
      icon: site.icon,
      isUp: lastCheck?.isUp ?? true,
      lastResponseTime: lastCheck?.responseTime ?? 0,
      uptimePercentage: uptime?.percentage ?? 100,
      lastChecked: lastCheck?.checkedAt?.toISOString() ?? new Date().toISOString(),
    };
  });

  const deploymentInfos: DeploymentInfo[] = recentDeployments.map((d) => ({
    id: d.id,
    siteId: d.siteId,
    siteName: d.site.name,
    villageName: d.site.villageName,
    status: d.status as DeploymentInfo["status"],
    questName: d.questName,
    xpAwarded: d.xpAwarded,
    triggeredAt: d.triggeredAt.toISOString(),
    completedAt: d.completedAt?.toISOString() ?? null,
  }));

  const activityEntries: ActivityLogEntry[] = recentActivity.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    metadata: a.metadata as Record<string, unknown> | null,
    createdAt: a.createdAt.toISOString(),
  }));

  const [total, openCount, inProgressCount, completedCount, failedCount, overdueCount, xpAgg] = questStatsData;
  const questStats: QuestStats = {
    total,
    byStatus: { open: openCount, in_progress: inProgressCount, completed: completedCount, failed: failedCount, cancelled: 0 },
    byPriority: { legendary: 0, epic: 0, rare: 0, normal: 0, common: 0 },
    overdue: overdueCount,
    completedThisWeek: 0,
    totalXpFromQuests: xpAgg._sum.xpReward ?? 0,
  };

  // Mock server metrics until SSH is connected
  const serverMetrics = {
    cpuUsage: 0,
    ramUsage: 0,
    ramTotal: 0,
    diskUsage: 0,
    diskTotal: 0,
    networkIn: 0,
    networkOut: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1
          className="text-2xl font-bold rpg-gradient-text"
          style={{ fontFamily: "var(--font-medieval)" }}
        >
          Krallık Haritası
        </h1>
        <p className="text-sm text-parchment-dim mt-1">
          Sunucu ve sitelerinin genel durumu
        </p>
      </div>

      {/* Castle Map */}
      <CastleMap sites={siteStatuses} serverMetrics={serverMetrics} />

      {/* Bottom widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuestBoard deployments={deploymentInfos} />
        <QuestSummaryWidget stats={questStats} />
        <ActivityFeed activities={activityEntries} />
      </div>
    </div>
  );
}
