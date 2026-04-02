import { prisma } from "@/lib/db";
import { SitesList } from "./SitesList";
import type { SiteStatus } from "@/types";

export default async function SitesPage() {
  const sites = await prisma.site.findMany({
    orderBy: { order: "asc" },
    include: {
      healthChecks: {
        orderBy: { checkedAt: "desc" },
        take: 1,
      },
    },
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold rpg-gradient-text"
          style={{ fontFamily: "var(--font-medieval)" }}
        >
          Köyler
        </h1>
        <p className="text-sm text-parchment-dim mt-1">
          Tüm site ve uygulamalarının durumu
        </p>
      </div>
      <SitesList sites={siteStatuses} />
    </div>
  );
}
