import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sites = await prisma.site.findMany({
    orderBy: { order: "asc" },
    include: {
      healthChecks: {
        orderBy: { checkedAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json(sites);
}
