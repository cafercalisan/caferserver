import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deployments = await prisma.deployment.findMany({
    orderBy: { triggeredAt: "desc" },
    take: 50,
    include: { site: true },
  });

  return NextResponse.json(deployments);
}
