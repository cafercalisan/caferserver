import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const achievements = await prisma.achievement.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(achievements);
}
