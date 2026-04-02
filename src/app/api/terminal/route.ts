import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runSSHCommand, isSSHConfigured } from "@/lib/ssh";

const BLOCKED_COMMANDS = ["rm -rf /", "mkfs", "dd if=/dev/zero", "> /dev/sda"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSSHConfigured()) {
    return NextResponse.json({
      error: "SSH yapılandırılmamış. .env dosyasında SSH_HOST ve SSH_PRIVATE_KEY ayarlayın.",
    }, { status: 503 });
  }

  try {
    const { command } = await req.json();
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Komut gerekli" }, { status: 400 });
    }

    // Safety check
    if (BLOCKED_COMMANDS.some((blocked) => command.includes(blocked))) {
      return NextResponse.json({
        error: "Bu komut güvenlik nedeniyle engellendi!",
      }, { status: 403 });
    }

    const output = await runSSHCommand(command);
    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json(
      { error: `Komut çalıştırma hatası: ${String(error)}` },
      { status: 500 }
    );
  }
}
