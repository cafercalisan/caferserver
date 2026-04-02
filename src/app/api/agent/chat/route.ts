import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GoogleGenAI, type FunctionDeclaration, Type } from "@google/genai";
import { runSSHCommand, isSSHConfigured } from "@/lib/ssh";

async function log(qid: string, author: string, content: string) {
  await prisma.questComment.create({ data: { questId: qid, author, content } });
}

const BLOCKED = ["rm -rf /", "rm -rf /*", "mkfs", "dd if=", "> /dev/sd", "chmod 777 /"];
function isSafe(cmd: string) { return !BLOCKED.some(b => cmd.includes(b)); }

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "run_command",
    description: "Sunucuda SSH komutu calistir ve sonucunu al. Her turlu komut calistirilabilir: docker, git, npm, cat, ls, mkdir, vb.",
    parameters: {
      type: Type.OBJECT,
      properties: { command: { type: Type.STRING, description: "SSH komutu" } },
      required: ["command"],
    },
  },
  {
    name: "write_file",
    description: "Sunucuda belirtilen yola dosya olustur veya mevcut dosyanin ustune yaz. Content tam dosya icerigi olmalidir.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: "Tam dosya yolu" },
        content: { type: Type.STRING, description: "Dosyanin tam icerigi" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "report_progress",
    description: "Kullaniciya gorev ilerlemesi hakkinda bilgi ver. Her onemli adimda cagir.",
    parameters: {
      type: Type.OBJECT,
      properties: { step: { type: Type.STRING, description: "Turkce ilerleme mesaji" } },
      required: ["step"],
    },
  },
];

async function execTool(name: string, args: Record<string, string>, qid: string): Promise<string> {
  if (!isSSHConfigured() && name !== "report_progress") {
    return "HATA: SSH yapilandirilmamis (SSH_PRIVATE_KEY bos). Sunucuda komut calistirilamaz.";
  }

  switch (name) {
    case "run_command": {
      if (!isSafe(args.command)) return "ENGELLENDI: Guvenli olmayan komut.";
      await log(qid, "agent", `$ ${args.command}`);
      try {
        const r = await runSSHCommand(args.command);
        const out = r.substring(0, 4000) || "(bos cikti)";
        return out;
      } catch (e: unknown) { return `HATA: ${(e as Error).message}`; }
    }
    case "write_file": {
      await log(qid, "agent", `📝 Yazılıyor: ${args.path}`);
      try {
        const dir = args.path.substring(0, args.path.lastIndexOf("/"));
        await runSSHCommand(`mkdir -p "${dir}"`);
        // base64 ile guvenli dosya yazimi
        const b64 = Buffer.from(args.content, "utf-8").toString("base64");
        await runSSHCommand(`echo '${b64}' | base64 -d > "${args.path}"`);
        const sz = (await runSSHCommand(`wc -c < "${args.path}"`)).trim();
        await log(qid, "agent", `✅ Yazıldı: ${args.path} (${sz} byte)`);
        return `Dosya yazildi: ${args.path} (${sz} byte)`;
      } catch (e: unknown) { return `HATA: ${(e as Error).message}`; }
    }
    case "report_progress": {
      await log(qid, "assistant", `📋 ${args.step}`);
      return "Rapor gosterildi, devam et.";
    }
    default: return "Bilinmeyen tool";
  }
}

// ===== OTONOM AGENT LOOP =====
async function runAgent(questId: string, task: string, apiKey: string) {
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: { site: true },
  });
  if (!quest) return;

  const site = quest.site;
  const systemPrompt = `Sen sunucuda OTONOM calisan bir yazilim agent'isin.

GOREV: ${task}

HEDEF SITE: ${site?.name ?? "genel"} (${site?.url ?? ""})

CALISMA SEKLI:
- Kullaniciya ASLA soru sorma. Her seyi kendin karar ver ve yap.
- Hemen tool'lari cagirarak ise basla.
- Once mevcut yapiyi anla: run_command ile "docker ps", "ls /opt/", vs.
- Hedef projeyi bul, dizin yapisini incele.
- Gereken dosyalari write_file ile olustur.
- Her 3-4 islemde report_progress ile kullaniciya durum bildir.
- Islemin sonunda git commit yap ve gerekirse docker rebuild/restart yap.
- En sonda report_progress ile "TAMAMLANDI: ..." mesaji ver.
- TURKCE yaz.
- Hata alirsan kendin coz, alternatif dene.

ONEMLI:
- Birden fazla dosya olusturman gerekebilir — hepsini sirayla yap.
- "Yapacagim" deme, DIREKT yap.
- report_progress cagirip bekleme — hemen sonraki adima gec.
- Minimum 10 adim calis, gorevi gerçekten tamamla.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const chat = await ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        tools: [{ functionDeclarations: toolDeclarations }],
        systemInstruction: systemPrompt,
      },
    });

    await log(questId, "assistant", `🚀 Agent başlatıldı — otonom çalışıyor...`);

    // Baslat
    let resp = await chat.sendMessage({
      message: `HEMEN BASLA. Gorev: ${task}

Ilk adimlarin:
1. run_command: "docker ps" — sunucudaki servisleri gor
2. run_command: "ls /opt/" — proje dizinlerini gor
3. Hedef projeyi bul ve yapisini incele
4. Gereken dosyalari olustur
5. Git commit, build, deploy

SIMDI ILK KOMUTU CALISTIR.`,
    });

    for (let i = 0; i < 40; i++) {
      const parts = resp.candidates?.[0]?.content?.parts;
      if (!parts || parts.length === 0) {
        await log(questId, "system", "Agent yanıt üretmedi, yeniden deniyor...");
        resp = await chat.sendMessage({ message: "Devam et, gorevi tamamla. Siradaki adimi yap." });
        continue;
      }

      // Tum text'leri logla
      for (const p of parts) {
        if (p.text?.trim()) {
          await log(questId, "assistant", p.text.trim());
        }
      }

      // Function call'lari topla
      const fcs = parts.filter(p => p.functionCall);

      if (fcs.length === 0) {
        // Hic function call yok — agent text yazdi ama is yapmadi
        // Tekrar durt
        resp = await chat.sendMessage({
          message: "TOOL CAGIRMALISIN. Soru sorma, aciklama yapma — siradaki islemi yap. run_command veya write_file cagir.",
        });
        continue;
      }

      // Her function call'i sirayla calistir ve sonuclari topla
      const results: Array<{ name: string; response: { result: string } }> = [];
      for (const p of fcs) {
        const fc = p.functionCall!;
        const result = await execTool(fc.name!, fc.args as Record<string, string>, questId);
        results.push({ name: fc.name!, response: { result } });
      }

      // Sonuclari Gemini'ye gonder
      // Gemini tek seferde tek functionResponse kabul ediyor, sirayla gonderelim
      for (let j = 0; j < results.length; j++) {
        if (j < results.length - 1) {
          // Ara sonuclar — sadece gonder, response'u atla
          await chat.sendMessage({
            message: { functionResponse: results[j] },
          });
        } else {
          // Son sonuc — response'u al ve loop devam etsin
          resp = await chat.sendMessage({
            message: { functionResponse: results[j] },
          });
        }
      }
    }

    await log(questId, "assistant", `✅ Agent tamamlandı.`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await log(questId, "system", `❌ Agent hatası: ${msg}`);
  }
}

// ===== HTTP ENDPOINT =====
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY yok" }, { status: 500 });

  const { message, questId } = await request.json();
  if (!message || !questId) return NextResponse.json({ error: "message ve questId gerekli" }, { status: 400 });

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  await log(questId, "user", message);

  // Fire-and-forget: arka planda calistir
  runAgent(questId, message, apiKey).catch(async (e) => {
    await log(questId, "system", `Agent crash: ${(e as Error).message}`);
  });

  return NextResponse.json({ started: true });
}
