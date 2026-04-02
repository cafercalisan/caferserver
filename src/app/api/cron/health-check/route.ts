import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createQuestFromEvent, autoCompleteQuestsForSite } from "@/lib/quests";

export async function GET(req: NextRequest) {
  // Verify secret
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.HEALTH_CHECK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sites = await prisma.site.findMany();
  const results = [];

  for (const site of sites) {
    const start = Date.now();
    let status = 0;
    let isUp = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(site.url, {
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeout);
      status = response.status;
      isUp = response.status >= 200 && response.status < 400;
    } catch {
      status = 0;
      isUp = false;
    }

    const responseTime = Date.now() - start;

    // Check previous state for alert
    const lastCheck = await prisma.healthCheck.findFirst({
      where: { siteId: site.id },
      orderBy: { checkedAt: "desc" },
    });

    // Save health check
    await prisma.healthCheck.create({
      data: {
        siteId: site.id,
        status,
        responseTime,
        isUp,
      },
    });

    // Log state transitions
    if (lastCheck && lastCheck.isUp && !isUp) {
      await prisma.activityLog.create({
        data: {
          type: "alert",
          message: `${site.villageName} düşman saldırısı altında! Site çöktü! 💀`,
          metadata: { siteId: site.id, status },
        },
      });
      // Otomatik quest olustur
      await createQuestFromEvent("site_down", { siteId: site.id });
    } else if (lastCheck && !lastCheck.isUp && isUp) {
      await prisma.activityLog.create({
        data: {
          type: "recovery",
          message: `${site.villageName} kurtarıldı! Site tekrar aktif. 🛡️`,
          metadata: { siteId: site.id, responseTime },
        },
      });
      // Acik bug_hunt quest'lerini otomatik tamamla
      await autoCompleteQuestsForSite(site.id);
    }

    results.push({ site: site.name, status, responseTime, isUp });
  }

  return NextResponse.json({ checked: results.length, results });
}
