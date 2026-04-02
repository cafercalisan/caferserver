import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { SiteDetail } from "./SiteDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SiteDetailPage({ params }: Props) {
  const { id } = await params;

  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      healthChecks: {
        orderBy: { checkedAt: "desc" },
        take: 60,
      },
      deployments: {
        orderBy: { triggeredAt: "desc" },
        take: 10,
      },
    },
  });

  if (!site) notFound();

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const dayChecks = await prisma.healthCheck.findMany({
    where: { siteId: site.id, checkedAt: { gte: oneDayAgo } },
    select: { isUp: true },
  });
  const total = dayChecks.length;
  const up = dayChecks.filter((c) => c.isUp).length;
  const uptimePercentage = total > 0 ? (up / total) * 100 : 100;

  return (
    <SiteDetail
      site={{
        id: site.id,
        name: site.name,
        url: site.url,
        villageName: site.villageName,
        villageType: site.villageType,
        icon: site.icon,
        coolifyId: site.coolifyId,
        uptimePercentage,
        isUp: site.healthChecks[0]?.isUp ?? true,
        lastResponseTime: site.healthChecks[0]?.responseTime ?? 0,
      }}
      healthChecks={site.healthChecks.map((h) => ({
        status: h.status,
        responseTime: h.responseTime,
        isUp: h.isUp,
        checkedAt: h.checkedAt.toISOString(),
      }))}
      deployments={site.deployments.map((d) => ({
        id: d.id,
        status: d.status,
        questName: d.questName,
        xpAwarded: d.xpAwarded,
        triggeredAt: d.triggeredAt.toISOString(),
        completedAt: d.completedAt?.toISOString() ?? null,
      }))}
    />
  );
}
