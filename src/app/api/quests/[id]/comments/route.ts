import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const comments = await prisma.questComment.findMany({
    where: { questId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { content, author } = body;

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const quest = await prisma.quest.findUnique({ where: { id } });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  const comment = await prisma.questComment.create({
    data: {
      questId: id,
      content,
      author: author ?? "user",
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
