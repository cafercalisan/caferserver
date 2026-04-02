import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GoogleGenAI, type FunctionDeclaration, Type } from "@google/genai";
import { runSSHCommand, isSSHConfigured } from "@/lib/ssh";

// Quest'e yorum ekle
async function log(questId: string, author: string, content: string) {
  await prisma.questComment.create({ data: { questId, author, content } });
}

// Guvenlik: tehlikeli komutlari engelle
const BLOCKED_PATTERNS = [
  "rm -rf /",
  "rm -rf /*",
  "mkfs",
  "dd if=",
  "> /dev/sd",
  "chmod 777 /",
  ":(){ :|:& };:",
];

function isSafeCommand(cmd: string): boolean {
  return !BLOCKED_PATTERNS.some((b) => cmd.includes(b));
}

// Tool tanimlari
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "run_command",
    description: "Sunucuda SSH komutu calistir. Docker, git, dosya islemleri, servis yonetimi icin kullan.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: "Calistirilacak SSH komutu" },
      },
      required: ["command"],
    },
  },
  {
    name: "read_file",
    description: "Sunucudaki bir dosyayi oku",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "Dosya yolu" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Sunucuda bir dosya olustur veya ustune yaz",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "Dosya yolu" },
        content: { type: Type.STRING, description: "Dosya icerigi" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_files",
    description: "Bir dizindeki dosya ve klasorleri listele",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "Dizin yolu" },
      },
      required: ["path"],
    },
  },
  {
    name: "report_progress",
    description: "Kullaniciya ilerleme raporu gonder. Her onemli adimda kullan.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        message: { type: Type.STRING, description: "Ilerleme mesaji" },
        agent: { type: Type.STRING, description: "Agent adi (ornek: deployment-ranger)" },
      },
      required: ["message"],
    },
  },
];

// Tool calistir
async function executeTool(
  name: string,
  args: Record<string, string>,
  questId: string
): Promise<string> {
  if (!isSSHConfigured() && name !== "report_progress") {
    return "SSH baglantisi yapilandirilmamis. SSH_HOST ve SSH_PRIVATE_KEY/.env'de gerekli.";
  }

  switch (name) {
    case "run_command": {
      if (!isSafeCommand(args.command)) {
        return "HATA: Bu komut guvenlik nedeniyle engellendi.";
      }
      await log(questId, "agent", `\`$ ${args.command}\``);
      try {
        const result = await runSSHCommand(args.command);
        return result.substring(0, 4000) || "(komut cikti uretmedi)";
      } catch (e: unknown) {
        return `HATA: ${e instanceof Error ? e.message : "Bilinmeyen hata"}`;
      }
    }
    case "read_file": {
      await log(questId, "agent", `Dosya okunuyor: \`${args.path}\``);
      try {
        const content = await runSSHCommand(`cat "${args.path}" 2>&1`);
        return content.substring(0, 6000);
      } catch (e: unknown) {
        return `HATA: ${e instanceof Error ? e.message : "Bilinmeyen hata"}`;
      }
    }
    case "write_file": {
      await log(questId, "agent", `Dosya yazılıyor: \`${args.path}\``);
      try {
        const dir = args.path.substring(0, args.path.lastIndexOf("/"));
        await runSSHCommand(`mkdir -p "${dir}"`);
        // Heredoc ile dosya yaz
        await runSSHCommand(`cat > "${args.path}" << 'AGENT_EOF'\n${args.content}\nAGENT_EOF`);
        const verify = await runSSHCommand(`wc -c < "${args.path}" 2>&1`);
        return `Dosya yazildi: ${args.path} (${verify.trim()} byte)`;
      } catch (e: unknown) {
        return `HATA: ${e instanceof Error ? e.message : "Bilinmeyen hata"}`;
      }
    }
    case "list_files": {
      try {
        return await runSSHCommand(`ls -la "${args.path}" 2>&1 | head -40`);
      } catch (e: unknown) {
        return `HATA: ${e instanceof Error ? e.message : "Bilinmeyen hata"}`;
      }
    }
    case "report_progress": {
      await log(questId, args.agent || "agent", args.message);
      return "Rapor gonderildi.";
    }
    default:
      return `Bilinmeyen tool: ${name}`;
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY ayarlanmamış. .env dosyasına ekleyin." }, { status: 500 });
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
      comments: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  // Kullanici mesajini kaydet
  await log(questId, "user", message);

  const siteContext = quest.site
    ? `Hedef site: ${quest.site.name} (${quest.site.url})
Village: ${quest.site.villageName} (${quest.site.villageType})
Coolify ID: ${quest.site.coolifyId || "yok"}`
    : "Belirli bir site secilmemis.";

  const systemPrompt = `Sen CaferServer panelinde calisan bir AI agent'sin.
Gorev: "${quest.title}"

${siteContext}

Gorev kategorisi: ${quest.category}
Oncelik: ${quest.priority}

KURALLAR:
1. Sunucuya SSH ile baglisin. Komut calistirabilir, dosya okuyup yazabilirsin.
2. Her onemli adimda report_progress tool'unu kullanarak kullaniciya ilerleme bildir.
3. Degisiklik yapmadan once mevcut yapıyı anla (dosyalari oku, dizinleri listele).
4. Kodu yazmadan once plan yap ve report_progress ile bildir.
5. Tehlikeli islemler yapma (veritabani silme, rm -rf, vb).
6. Turkce konusarak iletisim kur.
7. Hata alirsan acikla ve alternatif yol one sur.
8. Islemin sonunda ozet ver ve onizleme icin site URL'sini paylas.
9. Docker container icinde calisan uygulamalari degistirirken container'i rebuild et.
10. Git kullan — degisiklikleri commit et.

Bilinen proje dizinleri:
- /opt/caferserver — CaferServer panel (Next.js)
- Docker container'lari "docker ps" ile gorulebilir
- Coolify projeleri /data/coolify altinda olabilir
- Oncelikle "docker ps" ve dizin yapısını kesfet.

Onceki konusma:
${quest.comments.slice(-20).map((c) => `[${c.author}]: ${c.content}`).join("\n")}`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Gemini chat oturumu olustur
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: systemPrompt,
      },
    });

    // Ilk mesaji gonder
    let response = await (await chat).sendMessage({ message });

    let iterations = 0;
    const maxIterations = 25;

    while (iterations < maxIterations) {
      iterations++;

      // Function call var mi kontrol et
      const part = response.candidates?.[0]?.content?.parts?.[0];

      if (part?.functionCall) {
        const fc = part.functionCall;
        const toolName = fc.name!;
        const toolArgs = (fc.args as Record<string, string>) || {};

        // Tool calistir
        const result = await executeTool(toolName, toolArgs, questId);

        // Sonucu geri gonder
        response = await (await chat).sendMessage({
          message: {
            functionResponse: {
              name: toolName,
              response: { result },
            },
          },
        });
      } else {
        // Text yanit — bitti
        const text = part?.text || response.text || "";
        if (text) {
          await log(questId, "assistant", text);
        }
        break;
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Agent hatasi";
    await log(questId, "system", `Agent hatası: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
