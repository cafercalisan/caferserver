import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    total,
    openCount,
    inProgressCount,
    completedCount,
    failedCount,
    cancelledCount,
    legendaryCount,
    epicCount,
    rareCount,
    normalCount,
    commonCount,
    overdueCount,
    completedThisWeek,
    xpAgg,
  ] = await Promise.all([
    prisma.quest.count(),
    prisma.quest.count({ where: { status: "open" } }),
    prisma.quest.count({ where: { status: "in_progress" } }),
    prisma.quest.count({ where: { status: "completed" } }),
    prisma.quest.count({ where: { status: "failed" } }),
    prisma.quest.count({ where: { status: "cancelled" } }),
    prisma.quest.count({ where: { priority: "legendary" } }),
    prisma.quest.count({ where: { priority: "epic" } }),
    prisma.quest.count({ where: { priority: "rare" } }),
    prisma.quest.count({ where: { priority: "normal" } }),
    prisma.quest.count({ where: { priority: "common" } }),
    prisma.quest.count({
      where: {
        status: { in: ["open", "in_progress"] },
        dueDate: { lt: now },
      },
    }),
    prisma.quest.count({
      where: {
        status: "completed",
        completedAt: { gte: startOfWeek },
      },
    }),
    prisma.quest.aggregate({
      _sum: { xpReward: true },
      where: { status: "completed", xpAwarded: true },
    }),
  ]);

  return NextResponse.json({
    total,
    byStatus: {
      open: openCount,
      in_progress: inProgressCount,
      completed: completedCount,
      failed: failedCount,
      cancelled: cancelledCount,
    },
    byPriority: {
      legendary: legendaryCount,
      epic: epicCount,
      rare: rareCount,
      normal: normalCount,
      common: commonCount,
    },
    overdue: overdueCount,
    completedThisWeek,
    totalXpFromQuests: xpAgg._sum.xpReward ?? 0,
  });
}
