import { prisma } from "@/lib/db";
import { xpProgress } from "@/lib/xp";
import { ProfileView } from "./ProfileView";

export default async function ProfilePage() {
  const [user, achievements, deploymentCount] = await Promise.all([
    prisma.user.findFirst(),
    prisma.achievement.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.deployment.count({ where: { status: "success" } }),
  ]);

  if (!user) return null;

  return (
    <ProfileView
      user={{
        id: user.id,
        username: user.username,
        level: user.level,
        xp: user.xp,
        title: user.title,
        xpProgress: xpProgress(user.xp),
        createdAt: user.createdAt.toISOString(),
      }}
      achievements={achievements.map((a) => ({
        id: a.id,
        key: a.key,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xpReward: a.xpReward,
        unlockedAt: a.unlockedAt?.toISOString() ?? null,
      }))}
      stats={{ totalDeployments: deploymentCount }}
    />
  );
}
