import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { runSSHCommand, isSSHConfigured } from "@/lib/ssh";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

// Quest'e yorum ekle
async function log(questId: string, author: string, content: string) {
  await prisma.questComment.create({ data: { questId, author, content } });
}

// Tool tanimlari — agent sunucuda calisabilir
const tools: Anthropic.Tool[] = [
  {
    name: "run_command",
    description:
      "Sunucuda SSH komutu calistir. Docker, git, dosya islemleri, servis yonetimi icin kullan. Tehlikeli komutlar (rm -rf /, mkfs) yasak.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: { type: "string", description: "Calistirilacak SSH komutu" },
      },
      required: ["command"],
    },
  },
  {
    name: "read_file",
    description: "Sunucudaki bir dosyayi oku",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Dosya yolu (ornek: /opt/project/src/app/page.tsx)" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Sunucuda bir dosya olustur veya ustune yaz. Icerik tam dosya icerigi olmali.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Dosya yolu" },
        content: { type: "string", description: "Dosya icerigi" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_files",
    description: "Bir dizindeki dosya ve klasorleri listele",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Dizin yolu" },
      },
      required: ["path"],
    },
  },
  {
    name: "report_progress",
    description: "Kullaniciya ilerleme raporu gonder. Her onemli adimda kullan.",
    input_schema: {
      type: "object" as const,
      properties: {
        message: { type: "string", description: "Ilerleme mesaji" },
        agent: { type: "string", description: "Agent adi (ornek: deployment-ranger, content-steward)" },
      },
      required: ["message"],
    },
  },
];

// Guvenlik: tehlikeli komutlari engelle
const BLOCKED_COMMANDS = [
  "rm -rf /",
  "rm -rf /*",
  "mkfs",
  "dd if=",
  "> /dev/sd",
  "chmod 777 /",
  ":(){ :|:& };:",
];

function isSafeCommand(cmd: string): boolean {
  return !BLOCKED_COMMANDS.some((b) => cmd.includes(b));
}

// Tool calistir
async function executeTool(
  name: string,
  input: Record<string, string>,
  questId: string
): Promise<string> {
  if (!isSSHConfigured()) {
    return "SSH baglantisi yapilandirilmamis. SSH_HOST ve SSH_PRIVATE_KEY gerekli.";
  }

  switch (name) {
    case "run_command": {
      if (!isSafeCommand(input.command)) {
        return "HATA: Bu komut guvenlik nedeniyle engellendi.";
      }
      await log(questId, "agent", `\`$ ${input.command}\``);
      try {
        const result = await runSSHCommand(input.command);
        const output = result.substring(0, 3000);
        return output || "(komut cikti uretmedi)";
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
        return `HATA: ${msg}`;
      }
    }
    case "read_file": {
      await log(questId, "agent", `Dosya okunuyor: \`${input.path}\``);
      try {
        const content = await runSSHCommand(`cat "${input.path}" 2>&1`);
        return content.substring(0, 5000);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
        return `HATA: ${msg}`;
      }
    }
    case "write_file": {
      await log(questId, "agent", `Dosya yaziliyor: \`${input.path}\``);
      try {
        // Dizini olustur
        const dir = input.path.substring(0, input.path.lastIndexOf("/"));
        await runSSHCommand(`mkdir -p "${dir}"`);

        // Dosya yaz (heredoc ile)
        const escaped = input.content.replace(/\\/g, "\\\\").replace(/'/g, "'\\''");
        await runSSHCommand(`cat > "${input.path}" << 'AGENT_EOF'\n${input.content}\nAGENT_EOF`);

        // Dogrula
        const verify = await runSSHCommand(`wc -c < "${input.path}" 2>&1`);
        return `Dosya yazildi: ${input.path} (${verify.trim()} byte)`;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
        return `HATA: ${msg}`;
      }
    }
    case "list_files": {
      try {
        const result = await runSSHCommand(`ls -la "${input.path}" 2>&1 | head -30`);
        return result;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
        return `HATA: ${msg}`;
      }
    }
    case "report_progress": {
      const agent = input.agent || "agent";
      await log(questId, agent, input.message);
      return "Rapor gonderildi.";
    }
    default:
      return `Bilinmeyen tool: ${name}`;
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY ayarlanmamis" }, { status: 500 });
  }

  const body = await request.json();
  const { message, questId } = body;

  if (!message || !questId) {
    return NextResponse.json({ error: "message ve questId gerekli" }, { status: 400 });
  }

  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: {
      site: true,
      comments: { orderBy: { createdAt: "asc" }, take: 30 },
    },
  });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  // Kullanici mesajini kaydet
  await log(questId, "user", message);

  // Onceki konusma gecmisini olustur
  const conversationHistory: Anthropic.MessageParam[] = [];

  // Onceki yorumlardan konusma gecmisi
  for (const c of quest.comments) {
    if (c.author === "user") {
      conversationHistory.push({ role: "user", content: c.content });
    } else if (c.author === "agent" || c.author === "assistant") {
      conversationHistory.push({ role: "assistant", content: c.content });
    }
  }

  // Yeni mesaj
  conversationHistory.push({ role: "user", content: message });

  // Proje bilgisi
  const siteContext = quest.site
    ? `Hedef site: ${quest.site.name} (${quest.site.url})
Village: ${quest.site.villageName} (${quest.site.villageType})
Coolify ID: ${quest.site.coolifyId || "yok"}`
    : "Belirli bir site secilmemis.";

  // Sunucudaki projelerin konumlarini bul
  const projectPaths = `
Bilinen proje dizinleri:
- /opt/caferserver — CaferServer panel (Next.js)
- Coolify managed projeler /data/coolify/ altinda olabilir
- Docker container'lari "docker ps" ile gorulebilir
Oncelikle "docker ps" ve "find /opt -maxdepth 2 -type d" ile proje konumlarini kesfet.`;

  const systemPrompt = `Sen CaferServer panelinde calisan bir AI agent'sin. Gorev: "${quest.title}"

${siteContext}

${projectPaths}

Gorev kategorisi: ${quest.category}
Oncelik: ${quest.priority}

KURALLAR:
1. Sunucuya SSH ile baglisin. Komut calistirabilir, dosya okuyup yazabilirsin.
2. Her onemli adimda report_progress tool'unu kullanarak kullaniciya bilgi ver.
3. Degisiklik yapmadan once mevcut yapıyı anla (dosyalari oku, dizinleri listele).
4. Kodu yazmadan once plan yap ve kullaniciya bildir.
5. Tehlikeli islemler yapma (veritabani silme, rm -rf, vb).
6. Turkce konusarak iletisim kur.
7. Hata alirsan acikla ve alternatif yol one sur.
8. Islemin sonunda ozet ver ve onizleme icin site URL'sini paylas.
9. Docker container icinde calisan uygulamalari degistirirken container'i rebuild et.
10. Git kullan — degisiklikleri commit et.`;

  try {
    // Agent loop: Claude'u tool_use bitene kadar calistir
    let messages = conversationHistory;
    let finalResponse = "";
    let iterations = 0;
    const maxIterations = 25;

    while (iterations < maxIterations) {
      iterations++;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      });

      // Text bloklarini topla
      const textBlocks = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");

      if (textBlocks) {
        finalResponse = textBlocks;
      }

      // Tool use var mi?
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        // Bitti — son mesaji kaydet
        if (finalResponse) {
          await log(questId, "assistant", finalResponse);
        }
        break;
      }

      // Tool'lari calistir
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, string>,
          questId
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      // Mesajlari guncelle — assistant response + tool results
      messages = [
        ...messages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
    }

    return NextResponse.json({ success: true, response: finalResponse });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Agent hatasi";
    await log(questId, "system", `Agent hatasi: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
