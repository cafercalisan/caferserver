import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { completeQuest } from "@/lib/quests";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const quest = await prisma.quest.findUnique({
    where: { id },
    include: {
      site: { select: { id: true, name: true, villageName: true, villageType: true, icon: true } },
      deployment: { select: { id: true, status: true, questName: true, triggeredAt: true } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  return NextResponse.json(quest);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { title, description, status, priority, category, labels, dueDate, assignee } = body;

  const quest = await prisma.quest.findUnique({ where: { id } });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  // Status "completed" olursa ozel islem
  if (status === "completed" && quest.status !== "completed") {
    await completeQuest(id);
    const updated = await prisma.quest.findUnique({
      where: { id },
      include: {
        site: { select: { id: true, name: true, villageName: true, villageType: true } },
        comments: { orderBy: { createdAt: "asc" } },
      },
    });
    return NextResponse.json(updated);
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (priority !== undefined) data.priority = priority;
  if (category !== undefined) data.category = category;
  if (labels !== undefined) data.labels = labels;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (assignee !== undefined) data.assignee = assignee;

  // Status degisikligi
  if (status !== undefined && status !== quest.status) {
    data.status = status;
    if (status === "failed") {
      data.completedAt = new Date();
      await prisma.activityLog.create({
        data: {
          type: "quest_failed",
          message: `${quest.questName} görevi başarısız oldu!`,
          metadata: { questId: id },
        },
      });
    }
    if (status === "cancelled") {
      data.completedAt = new Date();
    }

    // Otomatik durum degisikligi yorumu
    const statusLabels: Record<string, string> = {
      open: "İlan Edildi",
      in_progress: "Sefer Başladı",
      completed: "Fethedildi",
      failed: "Düşmüş",
      cancelled: "Geri Çekildi",
    };
    await prisma.questComment.create({
      data: {
        questId: id,
        author: "system",
        content: `Durum değişti: ${statusLabels[quest.status] ?? quest.status} → ${statusLabels[status] ?? status}`,
      },
    });
  }

  const updated = await prisma.quest.update({
    where: { id },
    data,
    include: {
      site: { select: { id: true, name: true, villageName: true, villageType: true } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const quest = await prisma.quest.findUnique({ where: { id } });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  await prisma.quest.update({
    where: { id },
    data: { status: "cancelled", completedAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      type: "quest_cancelled",
      message: `${quest.questName} görevi iptal edildi.`,
      metadata: { questId: id },
    },
  });

  return NextResponse.json({ success: true });
}
