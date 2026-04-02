import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      healthChecks: { orderBy: { checkedAt: "desc" }, take: 60 },
      deployments: { orderBy: { triggeredAt: "desc" }, take: 10 },
    },
  });

  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(site);
}
