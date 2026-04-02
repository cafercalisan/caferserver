import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isSSHConfigured, runSSHCommand } from "@/lib/ssh";
import { isCoolifyConfigured, listApplications } from "@/lib/coolify";

// Goreve yorum ekleyen yardimci
async function log(questId: string, author: string, content: string) {
  await prisma.questComment.create({ data: { questId, author, content } });
}

// Kisa gecikme (adimlar arasi)
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const quest = await prisma.quest.findUnique({
    where: { id },
    include: { site: true },
  });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const phase = (body.phase as string) || "prepare"; // prepare | execute

  // Arka plan gorevlerini baslatiyoruz — response hemen donuyor
  // Islemler async olarak devam edip yorumlari quest'e yaziyor
  runQuestTasks(id, quest.category, quest.site, phase).catch(() => {});

  return NextResponse.json({ started: true, phase });
}

interface SiteData {
  id: string;
  name: string;
  url: string;
  villageName: string;
  coolifyId: string | null;
}

async function runQuestTasks(
  questId: string,
  category: string,
  site: SiteData | null,
  phase: string
) {
  if (phase === "prepare") {
    await runPreparationTasks(questId, category, site);
  } else if (phase === "execute") {
    await runExecutionTasks(questId, category, site);
  }
}

// PHASE 1: Gorev olusturulunca calisan hazirlik kontrolleri
async function runPreparationTasks(questId: string, category: string, site: SiteData | null) {
  await log(questId, "orchestrator", "Görev analiz ediliyor, uygun agent'lar devreye alınıyor...");
  await delay(800);

  switch (category) {
    case "bug_hunt":
      await prepareBugHunt(questId, site);
      break;
    case "fortification":
      await prepareFortification(questId, site);
      break;
    case "expedition":
      await prepareExpedition(questId, site);
      break;
    case "patrol":
      await preparePatrol(questId, site);
      break;
    case "ritual":
      await prepareRitual(questId);
      break;
    default:
      await prepareGeneral(questId);
      break;
  }
}

// PHASE 2: Sefere baslandiginda calisan gercek islemler
async function runExecutionTasks(questId: string, category: string, site: SiteData | null) {
  await log(questId, "orchestrator", "Sefer başlatıldı! Agent'lar görevlerine başlıyor...");
  await delay(600);

  switch (category) {
    case "bug_hunt":
      await executeBugHunt(questId, site);
      break;
    case "fortification":
      await executeFortification(questId, site);
      break;
    case "patrol":
      await executePatrol(questId);
      break;
    case "ritual":
      await executeRitual(questId);
      break;
    default:
      await executeGeneral(questId);
      break;
  }
}

// ===== BUG HUNT (Canavar Avı) =====

async function prepareBugHunt(questId: string, site: SiteData | null) {
  await log(questId, "scout-master", "Keşif başlatıldı, hedef analiz ediliyor...");
  await delay(500);

  // Site health check
  if (site) {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(site.url, { signal: controller.signal, redirect: "follow" });
      clearTimeout(timeout);
      const ms = Date.now() - start;

      if (res.ok) {
        await log(questId, "scout-master", `${site.villageName} erişim kontrolü: ✅ HTTP ${res.status} (${ms}ms)`);
      } else {
        await log(questId, "scout-master", `${site.villageName} erişim kontrolü: ⚠️ HTTP ${res.status} (${ms}ms) — Sorun tespit edildi!`);
      }
    } catch {
      await log(questId, "scout-master", `${site.villageName} erişim kontrolü: ❌ Site yanıt vermiyor!`);
    }
    await delay(400);
  }

  // Server resources
  if (isSSHConfigured()) {
    try {
      const disk = await runSSHCommand("df -h / | tail -1 | awk '{print $5}'");
      const mem = await runSSHCommand("free -m | grep Mem | awk '{printf \"%.0f\", $3/$2*100}'");
      await log(questId, "infrastructure-warden", `Sunucu durumu: Disk %${disk.trim()} · RAM %${mem.trim()}`);
    } catch {
      await log(questId, "infrastructure-warden", "Sunucu metriklerine SSH ile erişilemedi");
    }
    await delay(400);
  }

  // Docker container check
  if (isSSHConfigured() && site?.name) {
    try {
      const containers = await runSSHCommand(`docker ps --filter "name=${site.name.split('.')[0]}" --format "{{.Names}}: {{.Status}}" 2>/dev/null | head -5`);
      if (containers.trim()) {
        await log(questId, "infrastructure-warden", `İlgili container'lar:\n${containers.trim()}`);
      } else {
        await log(questId, "infrastructure-warden", "İlgili container bulunamadı");
      }
    } catch {
      // silent
    }
    await delay(400);
  }

  await log(questId, "orchestrator", "Ön keşif tamamlandı. Bulgular değerlendiriliyor, sefere başlamak için hazır.");
}

async function executeBugHunt(questId: string, site: SiteData | null) {
  // Detayli log analizi
  if (isSSHConfigured()) {
    await log(questId, "scout-master", "Son hata logları taranıyor...");
    await delay(500);

    try {
      const errors = await runSSHCommand("journalctl --since '1 hour ago' --priority err --no-pager -n 10 2>/dev/null | tail -10");
      if (errors.trim()) {
        await log(questId, "scout-master", `Son 1 saatteki hatalar:\n\`\`\`\n${errors.trim().substring(0, 500)}\n\`\`\``);
      } else {
        await log(questId, "scout-master", "Son 1 saatte sistem seviyesinde hata kaydı yok ✅");
      }
    } catch {
      await log(questId, "scout-master", "Sistem loglarına erişilemedi");
    }
    await delay(400);

    // Container logs
    if (site?.name) {
      try {
        const name = site.name.split('.')[0];
        const logs = await runSSHCommand(`docker logs ${name} --since 1h --tail 20 2>&1 | grep -iE "error|fail|exception|panic" | tail -5`);
        if (logs.trim()) {
          await log(questId, "scout-master", `Container hata logları (${name}):\n\`\`\`\n${logs.trim().substring(0, 500)}\n\`\`\``);
        } else {
          await log(questId, "scout-master", `Container loglarında hata bulunamadı (${name}) ✅`);
        }
      } catch {
        // silent
      }
    }
    await delay(400);
  }

  // Backup durumu kontrol
  await log(questId, "backup-oracle", "Son yedekleme durumu kontrol ediliyor...");
  await delay(500);

  const lastBackupLog = await prisma.activityLog.findFirst({
    where: { type: "backup", message: { contains: "başarılı" } },
    orderBy: { createdAt: "desc" },
  });
  if (lastBackupLog) {
    await log(questId, "backup-oracle", `Son başarılı yedek: ${lastBackupLog.createdAt.toLocaleDateString("tr-TR")} — Güvendesiniz ✅`);
  } else {
    await log(questId, "backup-oracle", "⚠️ Kayıtlarda başarılı yedekleme bulunamadı — Dikkatli olunmalı!");
  }

  await log(questId, "orchestrator", "Analiz tamamlandı. Görev günlüğündeki bulguları inceleyip gerekli aksiyonu alabilirsiniz.");
}

// ===== FORTIFICATION (Tahkim) =====

async function prepareFortification(questId: string, site: SiteData | null) {
  await log(questId, "deployment-ranger", "Deploy hazırlığı kontrolleri başlatıldı...");
  await delay(500);

  // Coolify durumu
  if (isCoolifyConfigured()) {
    try {
      const apps = await listApplications();
      const count = Array.isArray(apps) ? apps.length : 0;
      await log(questId, "deployment-ranger", `Coolify: ${count} uygulama kayıtlı ✅`);
    } catch {
      await log(questId, "deployment-ranger", "⚠️ Coolify API'ye erişilemedi");
    }
    await delay(400);
  }

  // Disk alani
  if (isSSHConfigured()) {
    try {
      const disk = await runSSHCommand("df -h / | tail -1");
      const parts = disk.trim().split(/\s+/);
      const available = parts[3] || "?";
      const usage = parts[4] || "?";
      await log(questId, "infrastructure-warden", `Disk durumu: ${usage} kullanımda, ${available} boş alan`);

      const dockerDisk = await runSSHCommand("docker system df --format 'Images: {{.Size}}' 2>/dev/null | head -1");
      if (dockerDisk.trim()) {
        await log(questId, "infrastructure-warden", `Docker disk kullanımı: ${dockerDisk.trim()}`);
      }
    } catch {
      // silent
    }
    await delay(400);
  }

  if (site) {
    const start = Date.now();
    try {
      const res = await fetch(site.url, { redirect: "follow" });
      const ms = Date.now() - start;
      await log(questId, "network-sentinel", `${site.villageName} mevcut durum: HTTP ${res.status} (${ms}ms)`);
    } catch {
      await log(questId, "network-sentinel", `${site.villageName} şu an erişilemiyor!`);
    }
  }

  await log(questId, "orchestrator", "Ön kontroller tamamlandı. Deploy için hazır.");
}

async function executeFortification(questId: string, site: SiteData | null) {
  if (isSSHConfigured()) {
    // RAM/CPU kontrolu
    await log(questId, "infrastructure-warden", "Sunucu kaynak analizi yapılıyor...");
    await delay(500);

    try {
      const top = await runSSHCommand("ps aux --sort=-%mem | head -6 | awk '{printf \"%-20s %s%%\\n\", $11, $4}'");
      await log(questId, "infrastructure-warden", `En çok RAM kullanan süreçler:\n\`\`\`\n${top.trim()}\n\`\`\``);
    } catch {
      // silent
    }
    await delay(400);

    try {
      const containers = await runSSHCommand("docker stats --no-stream --format 'table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}' 2>/dev/null | head -10");
      if (containers.trim()) {
        await log(questId, "infrastructure-warden", `Container kaynak kullanımı:\n\`\`\`\n${containers.trim()}\n\`\`\``);
      }
    } catch {
      // silent
    }
  }

  await log(questId, "orchestrator", "Kaynak analizi tamamlandı. Aksiyon alabilirsiniz.");
}

// ===== PATROL (Devriye) =====

async function preparePatrol(questId: string, site: SiteData | null) {
  await log(questId, "scout-master", "Devriye keşfi başlatılıyor, tüm siteler kontrol edilecek...");
  await delay(500);

  // Tum siteleri kontrol et
  const sites = await prisma.site.findMany({ orderBy: { order: "asc" } });
  const results: string[] = [];

  for (const s of sites) {
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(s.url, { signal: controller.signal, redirect: "follow" });
      clearTimeout(timeout);
      const ms = Date.now() - start;
      results.push(`${res.ok ? "✅" : "⚠️"} ${s.villageName}: HTTP ${res.status} (${ms}ms)`);
    } catch {
      results.push(`❌ ${s.villageName}: Erişilemiyor!`);
    }
  }

  await log(questId, "scout-master", `Site durumları:\n${results.join("\n")}`);
  await delay(400);

  // SSL kontrol
  if (isSSHConfigured()) {
    await log(questId, "network-sentinel", "SSL sertifika kontrolleri yapılıyor...");
    await delay(500);

    const sslResults: string[] = [];
    for (const s of sites) {
      try {
        const domain = new URL(s.url).hostname;
        const sslInfo = await runSSHCommand(`echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2`);
        if (sslInfo.trim()) {
          const expiry = new Date(sslInfo.trim());
          const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          sslResults.push(`${daysLeft > 14 ? "✅" : daysLeft > 0 ? "⚠️" : "❌"} ${domain}: ${daysLeft} gün kaldı`);
        }
      } catch {
        // silent
      }
    }
    if (sslResults.length > 0) {
      await log(questId, "network-sentinel", `SSL durumları:\n${sslResults.join("\n")}`);
    }
  }

  await log(questId, "orchestrator", "Devriye keşfi tamamlandı. Sefere başlanabilir.");
}

async function executePatrol(questId: string) {
  if (isSSHConfigured()) {
    await log(questId, "infrastructure-warden", "Detaylı sistem kontrolü başlatıldı...");
    await delay(500);

    try {
      const uptime = await runSSHCommand("uptime -p 2>/dev/null || uptime");
      await log(questId, "infrastructure-warden", `Sunucu uptime: ${uptime.trim()}`);
    } catch { /* silent */ }
    await delay(300);

    try {
      const failed = await runSSHCommand("systemctl list-units --state=failed --no-pager --no-legend 2>/dev/null | head -5");
      if (failed.trim()) {
        await log(questId, "infrastructure-warden", `⚠️ Başarısız servisler:\n\`\`\`\n${failed.trim()}\n\`\`\``);
      } else {
        await log(questId, "infrastructure-warden", "Tüm sistem servisleri çalışıyor ✅");
      }
    } catch { /* silent */ }
    await delay(300);

    try {
      const security = await runSSHCommand("last -10 --time-format iso 2>/dev/null | head -5");
      if (security.trim()) {
        await log(questId, "network-sentinel", `Son oturum girişleri:\n\`\`\`\n${security.trim()}\n\`\`\``);
      }
    } catch { /* silent */ }
  }

  await log(questId, "orchestrator", "Devriye raporu tamamlandı. Bulgular görev günlüğünde.");
}

// ===== RITUAL (Ayin) =====

async function prepareRitual(questId: string) {
  await log(questId, "backup-oracle", "Bakım öncesi kontroller başlatıldı...");
  await delay(500);

  if (isSSHConfigured()) {
    try {
      const disk = await runSSHCommand("df -h / | tail -1 | awk '{print $4}'");
      await log(questId, "infrastructure-warden", `Mevcut boş alan: ${disk.trim()}`);
    } catch { /* silent */ }
    await delay(400);

    try {
      const danglingImages = await runSSHCommand("docker images -f dangling=true -q 2>/dev/null | wc -l");
      const stoppedContainers = await runSSHCommand("docker ps -f status=exited -q 2>/dev/null | wc -l");
      await log(questId, "infrastructure-warden",
        `Temizlik adayları: ${danglingImages.trim()} kullanılmayan image, ${stoppedContainers.trim()} durmuş container`
      );
    } catch { /* silent */ }
  }

  await log(questId, "orchestrator", "Bakım kontrolleri tamamlandı. Sefere başlanabilir.");
}

async function executeRitual(questId: string) {
  if (isSSHConfigured()) {
    await log(questId, "infrastructure-warden", "Docker temizliği başlatılıyor (güvenli mod)...");
    await delay(600);

    try {
      const result = await runSSHCommand("docker system prune -f --filter 'until=720h' 2>&1 | tail -3");
      await log(questId, "infrastructure-warden", `Docker temizlik sonucu:\n${result.trim()}`);
    } catch (e) {
      await log(questId, "infrastructure-warden", "Docker temizliği sırasında hata oluştu");
    }
    await delay(400);

    try {
      const after = await runSSHCommand("df -h / | tail -1 | awk '{print $4}'");
      await log(questId, "infrastructure-warden", `Temizlik sonrası boş alan: ${after.trim()}`);
    } catch { /* silent */ }
  }

  await log(questId, "orchestrator", "Bakım işlemleri tamamlandı.");
}

// ===== GENERAL & EXPEDITION =====

async function prepareExpedition(questId: string, site: SiteData | null) {
  await log(questId, "orchestrator", "Keşif görevi için ön analiz yapılıyor...");
  await delay(500);

  if (site) {
    try {
      const start = Date.now();
      const res = await fetch(site.url, { redirect: "follow" });
      const ms = Date.now() - start;
      await log(questId, "scout-master", `${site.villageName} durumu: HTTP ${res.status} (${ms}ms) ${res.ok ? "✅" : "⚠️"}`);
    } catch {
      await log(questId, "scout-master", `${site.villageName} erişilemiyor!`);
    }
  }

  await log(questId, "orchestrator", "Ön analiz tamamlandı. Sefere başlamak için hazır.");
}

async function prepareGeneral(questId: string) {
  await log(questId, "orchestrator", "Görev kayıt altına alındı. İlgili agent'lar bilgilendirildi.");
  await delay(500);

  if (isSSHConfigured()) {
    try {
      const load = await runSSHCommand("uptime | awk -F'load average:' '{print $2}'");
      await log(questId, "infrastructure-warden", `Sunucu yük durumu: ${load.trim()}`);
    } catch { /* silent */ }
  }

  await log(questId, "orchestrator", "Görev sefere başlamaya hazır.");
}

async function executeGeneral(questId: string) {
  await log(questId, "orchestrator", "Görev üzerinde çalışılıyor...");
  await delay(500);
  await log(questId, "orchestrator", "Agent'lar aktif. İlerleme görev günlüğünden takip edilebilir.");
}
