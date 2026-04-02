import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const healthChecks = await prisma.healthCheck.findMany({
    where: { siteId: id },
    orderBy: { checkedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(healthChecks);
}
