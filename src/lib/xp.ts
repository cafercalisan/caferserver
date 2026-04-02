import { prisma } from "./db";
import { RPG_TITLES } from "./constants";

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * currentLevel * 100;
}

export function xpProgress(xp: number): { current: number; needed: number; percentage: number } {
  const level = calculateLevel(xp);
  const currentLevelXp = (level - 1) * (level - 1) * 100;
  const nextLevelXp = level * level * 100;
  const current = xp - currentLevelXp;
  const needed = nextLevelXp - currentLevelXp;
  return {
    current,
    needed,
    percentage: Math.min((current / needed) * 100, 100),
  };
}

export function getTitleForLevel(level: number): string {
  const levels = Object.keys(RPG_TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  for (const l of levels) {
    if (level >= l) return RPG_TITLES[l];
  }
  return RPG_TITLES[1];
}

export async function awardXP(userId: string, amount: number): Promise<{ newXp: number; newLevel: number; newTitle: string; leveledUp: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const oldLevel = user.level;
  const newXp = user.xp + amount;
  const newLevel = calculateLevel(newXp);
  const newTitle = getTitleForLevel(newLevel);
  const leveledUp = newLevel > oldLevel;

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp, level: newLevel, title: newTitle },
  });

  if (leveledUp) {
    await prisma.activityLog.create({
      data: {
        type: "level_up",
        message: `Seviye atladın! Seviye ${newLevel} - ${newTitle}`,
        metadata: { oldLevel, newLevel, newTitle },
      },
    });
  }

  return { newXp, newLevel, newTitle, leveledUp };
}
