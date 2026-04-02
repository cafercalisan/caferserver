import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const site = await prisma.site.findUnique({ where: { id } });
  if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

  // If Coolify is configured, fetch logs
  if (site.coolifyId && process.env.COOLIFY_API_TOKEN) {
    try {
      const response = await fetch(
        `${process.env.COOLIFY_API_URL}/api/v1/applications/${site.coolifyId}/logs`,
        {
          headers: {
            Authorization: `Bearer ${process.env.COOLIFY_API_TOKEN}`,
          },
        }
      );
      const data = await response.json();
      return NextResponse.json(data);
    } catch {
      return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
  }

  return NextResponse.json({ logs: "Coolify bağlantısı yapılandırılmamış" });
}
