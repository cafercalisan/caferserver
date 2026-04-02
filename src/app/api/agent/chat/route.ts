import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GoogleGenAI, type FunctionDeclaration, Type } from "@google/genai";
import { runSSHCommand, isSSHConfigured } from "@/lib/ssh";

// Quest'e yorum ekle
async function log(questId: string, author: string, content: string) {
  await prisma.questComment.create({ data: { questId, author, content } });
}

// Guvenlik
const BLOCKED = ["rm -rf /", "rm -rf /*", "mkfs", "dd if=", "> /dev/sd", "chmod 777 /", ":(){ :|:& };:"];
function isSafe(cmd: string) { return !BLOCKED.some((b) => cmd.includes(b)); }

// Tool tanimlari
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "run_command",
    description: "Sunucuda SSH komutu calistir. HEMEN calistir, sormadan yap.",
    parameters: {
      type: Type.OBJECT,
      properties: { command: { type: Type.STRING, description: "SSH komutu" } },
      required: ["command"],
    },
  },
  {
    name: "read_file",
    description: "Sunucudaki bir dosyayi oku. Tam icerigi dondurur.",
    parameters: {
      type: Type.OBJECT,
      properties: { path: { type: Type.STRING, description: "Dosya yolu" } },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Sunucuda dosya olustur/yaz. Tam icerigi gonder.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "Dosya yolu" },
        content: { type: Type.STRING, description: "Tam dosya icerigi" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_files",
    description: "Dizindeki dosyalari listele",
    parameters: {
      type: Type.OBJECT,
      properties: { path: { type: Type.STRING, description: "Dizin yolu" } },
      required: ["path"],
    },
  },
  {
    name: "report_progress",
    description: "Kullaniciya ilerleme mesaji goster. Her adimda kullan.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        step: { type: Type.STRING, description: "Adim aciklamasi (kisa, Turkce)" },
      },
      required: ["step"],
    },
  },
];

// Tool calistirici
async function execTool(name: string, args: Record<string, string>, qid: string): Promise<string> {
  switch (name) {
    case "run_command": {
      if (!isSSHConfigured()) return "HATA: SSH ayarlanmamis (SSH_PRIVATE_KEY bos).";
      if (!isSafe(args.command)) return "HATA: Guvenlik engeli.";
      await log(qid, "agent", `$ ${args.command}`);
      try {
        const r = await runSSHCommand(args.command);
        const out = r.substring(0, 4000) || "(bos cikti)";
        if (out.length > 200) await log(qid, "agent", `\`\`\`\n${out.substring(0, 500)}\n\`\`\``);
        return out;
      } catch (e: unknown) { return `HATA: ${(e as Error).message}`; }
    }
    case "read_file": {
      if (!isSSHConfigured()) return "HATA: SSH ayarlanmamis.";
      await log(qid, "agent", `Okunuyor: ${args.path}`);
      try {
        return (await runSSHCommand(`cat "${args.path}" 2>&1`)).substring(0, 8000);
      } catch (e: unknown) { return `HATA: ${(e as Error).message}`; }
    }
    case "write_file": {
      if (!isSSHConfigured()) return "HATA: SSH ayarlanmamis.";
      await log(qid, "agent", `Yazılıyor: ${args.path}`);
      try {
        const dir = args.path.substring(0, args.path.lastIndexOf("/"));
        await runSSHCommand(`mkdir -p "${dir}"`);
        await runSSHCommand(`cat > "${args.path}" << 'AGENT_EOF'\n${args.content}\nAGENT_EOF`);
        const sz = (await runSSHCommand(`wc -c < "${args.path}"`)).trim();
        await log(qid, "agent", `✅ ${args.path} (${sz} byte)`);
        return `Yazildi: ${args.path} (${sz} byte)`;
      } catch (e: unknown) { return `HATA: ${(e as Error).message}`; }
    }
    case "list_files": {
      if (!isSSHConfigured()) return "HATA: SSH ayarlanmamis.";
      try { return await runSSHCommand(`ls -la "${args.path}" 2>&1 | head -40`); }
      catch (e: unknown) { return `HATA: ${(e as Error).message}`; }
    }
    case "report_progress": {
      await log(qid, "assistant", `📋 ${args.step}`);
      return "OK";
    }
    default: return "Bilinmeyen tool";
  }
}

// ===== ARKA PLAN AGENT LOOP =====
async function runAgentLoop(questId: string, message: string, apiKey: string) {
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: { site: true },
  });
  if (!quest) return;

  const siteName = quest.site?.name ?? "belirtilmemiş";
  const siteUrl = quest.site?.url ?? "";
  const villageName = quest.site?.villageName ?? "";

  const systemPrompt = `Sen otonom calisan bir sunucu agent'isin. Kullanici sana bir gorev verdi, sen bunu TAMAMEN KENDI BASINA tamamlayacaksin. Kullaniciya SORU SORMA, kendin karar ver ve calistir.

GOREV: "${quest.title}"
KULLANICI TALIMATI: "${message}"
HEDEF SITE: ${siteName} (${siteUrl}) — Village: ${villageName}

CALISMA KURALLARI:
1. HEMEN ise basla. Soru sorma, izin isteme, plan anlatma — DIREKT tool'lari cagir.
2. Ilk adim: "docker ps" ve "ls /opt/" ile sunucu yapisini kesfet.
3. Hedef projenin dizinini bul, yapisini anla.
4. Gereken dosyalari olustur/duzenle (write_file).
5. Her 2-3 islemde report_progress ile kisa durum bildir.
6. Git commit yap, gerekirse docker rebuild/restart yap.
7. Bitince report_progress ile OZET ver ve site URL'sini paylas.
8. TURKCE yaz.
9. Hata alirsan KENDIN coz, kullaniciya danisma.
10. ASLA "yapacagim", "yapmak istiyorum" deme — DIREKT YAP.

ONEMLI: Sen bir agirlık — bekleme, soru sorma, onay isteme yok. Gorevi bastan sona kendin tamamla.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const chat = await ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: systemPrompt,
      },
    });

    await log(questId, "assistant", `🚀 Agent başlatıldı — görev üzerinde otonom çalışıyor...`);

    // Gorevi baslat
    let response = await chat.sendMessage({
      message: `Gorevi hemen baslat. Ilk olarak sunucuyu kesfet (docker ps, ls /opt/) ve sonra gorevi tamamla: ${message}`,
    });

    let iterations = 0;
    const maxIterations = 40;

    while (iterations < maxIterations) {
      iterations++;

      const parts = response.candidates?.[0]?.content?.parts;
      if (!parts || parts.length === 0) break;

      // Tum part'lari isle
      let hasFunctionCall = false;
      const functionResponses: Array<{ name: string; response: { result: string } }> = [];

      for (const part of parts) {
        // Text varsa logla
        if (part.text && part.text.trim()) {
          await log(questId, "assistant", part.text.trim());
        }

        // Function call varsa calistir
        if (part.functionCall) {
          hasFunctionCall = true;
          const fc = part.functionCall;
          const name = fc.name!;
          const args = (fc.args as Record<string, string>) || {};

          const result = await execTool(name, args, questId);
          functionResponses.push({
            name,
            response: { result },
          });
        }
      }

      // Eger function call yoksa agent bitmis demektir
      if (!hasFunctionCall) break;

      // Function response'lari gonder — agent devam etsin
      if (functionResponses.length === 1) {
        response = await chat.sendMessage({
          message: { functionResponse: functionResponses[0] },
        });
      } else {
        // Birden fazla function call — hepsini gonder
        for (const fr of functionResponses) {
          response = await chat.sendMessage({
            message: { functionResponse: fr },
          });
        }
      }

      // stop_reason kontrol
      if (response.candidates?.[0]?.finishReason === "STOP") {
        // Son text varsa logla
        const lastText = response.candidates?.[0]?.content?.parts
          ?.filter((p: { text?: string }) => p.text)
          .map((p: { text?: string }) => p.text)
          .join("\n");
        if (lastText?.trim()) {
          await log(questId, "assistant", lastText.trim());
        }
        break;
      }
    }

    await log(questId, "assistant", `✅ Agent görevi tamamladı. (${iterations} adım)`);

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    await log(questId, "system", `❌ Agent hatası: ${msg}`);
  }
}

// ===== HTTP ENDPOINT =====
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY ayarlanmamış" }, { status: 500 });
  }

  const body = await request.json();
  const { message, questId } = body;

  if (!message || !questId) {
    return NextResponse.json({ error: "message ve questId gerekli" }, { status: 400 });
  }

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  // Kullanici mesajini kaydet
  await log(questId, "user", message);

  // ARKA PLANDA agent'i baslat — HTTP hemen doner
  runAgentLoop(questId, message, apiKey).catch(async (e) => {
    await log(questId, "system", `Agent crash: ${e instanceof Error ? e.message : "?"}`);
  });

  // Hemen don — kullanici auto-refresh ile takip edecek
  return NextResponse.json({ started: true, message: "Agent arka planda çalışmaya başladı" });
}
