import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateQuestName } from "@/lib/rpg-names";
import { getQuestXpReward } from "@/lib/quests";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const category = searchParams.get("category");
  const siteId = searchParams.get("siteId");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (siteId) where.siteId = siteId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { questName: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [quests, total] = await Promise.all([
    prisma.quest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        site: { select: { id: true, name: true, villageName: true, villageType: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.quest.count({ where }),
  ]);

  const data = quests.map((q) => ({
    ...q,
    siteName: q.site?.name ?? null,
    villageType: q.site?.villageType ?? null,
    commentCount: q._count.comments,
    site: undefined,
    _count: undefined,
  }));

  return NextResponse.json({ quests: data, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, priority, category, siteId, labels, dueDate, assignee } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const site = siteId ? await prisma.site.findUnique({ where: { id: siteId } }) : null;
  const villageName = site?.villageName ?? "Krallık";
  const questName = generateQuestName(villageName);
  const questPriority = priority ?? "normal";
  const xpReward = getQuestXpReward(questPriority);

  const quest = await prisma.quest.create({
    data: {
      title,
      description: description ?? null,
      questName,
      priority: questPriority,
      category: category ?? "general",
      siteId: siteId ?? null,
      labels: labels ?? [],
      dueDate: dueDate ? new Date(dueDate) : null,
      assignee: assignee ?? null,
      xpReward,
      createdBy: "user",
    },
  });

  await prisma.activityLog.create({
    data: {
      type: "quest_created",
      message: `Yeni görev ilan edildi: ${questName}`,
      metadata: { questId: quest.id, priority: questPriority, category: quest.category },
    },
  });

  return NextResponse.json(quest, { status: 201 });
}
