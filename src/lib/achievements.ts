import { prisma } from "./db";
import { awardXP } from "./xp";

export async function checkAndUnlockAchievement(key: string): Promise<boolean> {
  const achievement = await prisma.achievement.findUnique({ where: { key } });
  if (!achievement || achievement.unlockedAt) return false;

  // Check if the condition is met
  let conditionMet = false;

  switch (key) {
    case "first_blood": {
      const count = await prisma.deployment.count({ where: { status: "success" } });
      conditionMet = count >= 1;
      break;
    }
    case "quest_master": {
      const count = await prisma.deployment.count({ where: { status: "success" } });
      conditionMet = count >= 50;
      break;
    }
    case "night_owl": {
      const nightDeploys = await prisma.deployment.findFirst({
        where: {
          status: "success",
          triggeredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      });
      const hour = nightDeploys?.triggeredAt.getHours();
      conditionMet = hour !== undefined && (hour >= 0 && hour < 6);
      break;
    }
    default:
      return false;
  }

  if (conditionMet) {
    await prisma.achievement.update({
      where: { key },
      data: { unlockedAt: new Date() },
    });

    const user = await prisma.user.findFirst();
    if (user) {
      await awardXP(user.id, achievement.xpReward);
    }

    await prisma.activityLog.create({
      data: {
        type: "achievement",
        message: `Başarım açıldı: ${achievement.icon} ${achievement.name}! +${achievement.xpReward} XP`,
        metadata: { achievementKey: key },
      },
    });

    return true;
  }

  return false;
}

export async function checkAllAchievements(): Promise<string[]> {
  const unlocked: string[] = [];
  const achievements = await prisma.achievement.findMany({
    where: { unlockedAt: null },
  });

  for (const achievement of achievements) {
    const wasUnlocked = await checkAndUnlockAchievement(achievement.key);
    if (wasUnlocked) unlocked.push(achievement.key);
  }

  return unlocked;
}
