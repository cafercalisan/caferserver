import { prisma } from "./db";
import { QUEST_XP_BASE } from "./constants";
import { generateQuestName } from "./rpg-names";
import { awardXP } from "./xp";

export function getQuestXpReward(priority: string): number {
  return QUEST_XP_BASE[priority] ?? QUEST_XP_BASE.normal;
}

export async function createQuestFromEvent(
  type: "deploy_failed" | "site_down" | "ssl_expiring" | "disk_warning",
  data: { siteId?: string; deploymentId?: string; title?: string }
): Promise<string | null> {
  // Duplikasyon kontrolu: ayni site icin acik quest var mi
  if (data.siteId) {
    const existing = await prisma.quest.findFirst({
      where: {
        siteId: data.siteId,
        status: { in: ["open", "in_progress"] },
        category: "bug_hunt",
      },
    });
    if (existing) return existing.id;
  }

  const site = data.siteId
    ? await prisma.site.findUnique({ where: { id: data.siteId } })
    : null;

  const villageName = site?.villageName ?? "Bilinmeyen Koy";

  const config: Record<string, { title: string; priority: string; category: string; createdBy: string }> = {
    deploy_failed: {
      title: data.title ?? `Deploy basarisiz: ${villageName}`,
      priority: "epic",
      category: "bug_hunt",
      createdBy: "deployment-ranger",
    },
    site_down: {
      title: data.title ?? `${villageName} dusmus! Kurtarma gerektiriyor`,
      priority: "rare",
      category: "bug_hunt",
      createdBy: "scout-master",
    },
    ssl_expiring: {
      title: data.title ?? `${villageName} SSL sertifikasi sona yaklasiyor`,
      priority: "normal",
      category: "patrol",
      createdBy: "network-sentinel",
    },
    disk_warning: {
      title: data.title ?? `Sunucu disk alani kritik seviyede`,
      priority: "rare",
      category: "patrol",
      createdBy: "infrastructure-warden",
    },
  };

  const c = config[type];
  const questName = generateQuestName(villageName);
  const xpReward = getQuestXpReward(c.priority);

  const quest = await prisma.quest.create({
    data: {
      title: c.title,
      questName,
      status: "open",
      priority: c.priority,
      category: c.category,
      siteId: data.siteId ?? null,
      deploymentId: data.deploymentId ?? null,
      xpReward,
      createdBy: c.createdBy,
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "quest_created",
      message: `Yeni gorev ilan edildi: ${questName}`,
      metadata: { questId: quest.id, category: c.category, priority: c.priority },
    },
  });

  return quest.id;
}

export async function completeQuest(questId: string): Promise<void> {
  const quest = await prisma.quest.findUniqueOrThrow({ where: { id: questId } });

  await prisma.quest.update({
    where: { id: questId },
    data: {
      status: "completed",
      completedAt: new Date(),
      xpAwarded: true,
    },
  });

  // XP ver
  if (!quest.xpAwarded && quest.xpReward > 0) {
    const user = await prisma.user.findFirst();
    if (user) {
      await awardXP(user.id, quest.xpReward);
    }
  }

  await prisma.activityLog.create({
    data: {
      type: "quest_completed",
      message: `${quest.questName} fethedildi! +${quest.xpReward} XP`,
      metadata: { questId, xpReward: quest.xpReward },
    },
  });

  // Otomatik yorum ekle
  await prisma.questComment.create({
    data: {
      questId,
      author: "system",
      content: "Gorev basariyla tamamlandi!",
    },
  });
}

export async function autoCompleteQuestsForSite(siteId: string): Promise<void> {
  const openQuests = await prisma.quest.findMany({
    where: {
      siteId,
      category: "bug_hunt",
      status: { in: ["open", "in_progress"] },
    },
  });

  for (const quest of openQuests) {
    await completeQuest(quest.id);
    await prisma.questComment.create({
      data: {
        questId: quest.id,
        author: "scout-master",
        content: "Site otomatik olarak iyilesti, gorev tamamlandi.",
      },
    });
  }
}
