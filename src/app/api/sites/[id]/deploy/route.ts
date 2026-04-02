import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateQuestName } from "@/lib/rpg-names";
import { XP_VALUES } from "@/lib/constants";
import { awardXP } from "@/lib/xp";
import { createQuestFromEvent } from "@/lib/quests";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const questName = generateQuestName(site.villageName);

  // Create deployment record
  const deployment = await prisma.deployment.create({
    data: {
      siteId: site.id,
      questName,
      status: "pending",
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      type: "deploy",
      message: `${questName} görevi başlatıldı!`,
      metadata: { siteId: site.id, deploymentId: deployment.id },
    },
  });

  // If Coolify is configured, trigger deployment
  if (site.coolifyId && process.env.COOLIFY_API_TOKEN) {
    try {
      const response = await fetch(
        `${process.env.COOLIFY_API_URL}/api/v1/applications/${site.coolifyId}/deploy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.COOLIFY_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await prisma.deployment.update({
          where: { id: deployment.id },
          data: { status: "building" },
        });
      } else {
        await prisma.deployment.update({
          where: { id: deployment.id },
          data: { status: "failed", completedAt: new Date() },
        });
        await createQuestFromEvent("deploy_failed", { siteId: site.id, deploymentId: deployment.id });
      }
    } catch {
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: { status: "failed", completedAt: new Date() },
      });
      await createQuestFromEvent("deploy_failed", { siteId: site.id, deploymentId: deployment.id });
    }
  } else {
    // Simulate success for now
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: "success",
        completedAt: new Date(),
        xpAwarded: XP_VALUES.DEPLOY_SUCCESS,
      },
    });

    // Award XP
    const user = await prisma.user.findFirst();
    if (user) {
      await awardXP(user.id, XP_VALUES.DEPLOY_SUCCESS);
    }

    await prisma.activityLog.create({
      data: {
        type: "deploy",
        message: `${questName} başarıyla tamamlandı! +${XP_VALUES.DEPLOY_SUCCESS} XP`,
        metadata: { siteId: site.id, deploymentId: deployment.id },
      },
    });
  }

  return NextResponse.json(deployment);
}
