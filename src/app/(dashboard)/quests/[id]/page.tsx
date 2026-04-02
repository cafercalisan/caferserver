import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { QuestDetail } from "./QuestDetail";

interface QuestPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuestPage({ params }: QuestPageProps) {
  const { id } = await params;

  const quest = await prisma.quest.findUnique({
    where: { id },
    include: {
      site: { select: { id: true, name: true, villageName: true, villageType: true, icon: true } },
      deployment: { select: { id: true, status: true, questName: true, triggeredAt: true } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!quest) notFound();

  const serialized = {
    ...quest,
    dueDate: quest.dueDate?.toISOString() ?? null,
    completedAt: quest.completedAt?.toISOString() ?? null,
    createdAt: quest.createdAt.toISOString(),
    updatedAt: quest.updatedAt.toISOString(),
    deployment: quest.deployment
      ? { ...quest.deployment, triggeredAt: quest.deployment.triggeredAt.toISOString() }
      : null,
    comments: quest.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return <QuestDetail quest={serialized} />;
}
