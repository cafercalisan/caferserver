import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerMetrics, isSSHConfigured } from "@/lib/ssh";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSSHConfigured()) {
    // Return latest from DB or mock data
    const latest = await prisma.serverMetric.findFirst({
      orderBy: { recordedAt: "desc" },
    });

    if (latest) {
      return NextResponse.json(latest);
    }

    return NextResponse.json({
      cpuUsage: 0,
      ramUsage: 0,
      ramTotal: 0,
      diskUsage: 0,
      diskTotal: 0,
      networkIn: 0,
      networkOut: 0,
      uptime: "SSH yapılandırılmamış",
      hostname: "unknown",
    });
  }

  try {
    const metrics = await getServerMetrics();

    // Save to DB
    await prisma.serverMetric.create({
      data: {
        cpuUsage: metrics.cpuUsage,
        ramUsage: metrics.ramUsage,
        ramTotal: metrics.ramTotal,
        diskUsage: metrics.diskUsage,
        diskTotal: metrics.diskTotal,
        networkIn: metrics.networkIn,
        networkOut: metrics.networkOut,
      },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json(
      { error: "SSH bağlantısı başarısız", details: String(error) },
      { status: 500 }
    );
  }
}
