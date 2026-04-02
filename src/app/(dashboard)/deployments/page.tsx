import { prisma } from "@/lib/db";
import { DeploymentsList } from "./DeploymentsList";
import type { DeploymentInfo } from "@/types";

export default async function DeploymentsPage() {
  const deployments = await prisma.deployment.findMany({
    orderBy: { triggeredAt: "desc" },
    take: 50,
    include: { site: true },
  });

  const deploymentInfos: DeploymentInfo[] = deployments.map((d) => ({
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

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold rpg-gradient-text"
          style={{ fontFamily: "var(--font-medieval)" }}
        >
          Görev Tahtası
        </h1>
        <p className="text-sm text-parchment-dim mt-1">
          Tüm deployment görevleri
        </p>
      </div>
      <DeploymentsList deployments={deploymentInfos} />
    </div>
  );
}
