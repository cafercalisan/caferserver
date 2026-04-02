import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runSSHCommand, isSSHConfigured } from "@/lib/ssh";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSSHConfigured()) {
    return NextResponse.json({
      hostname: "Yapılandırılmamış",
      os: "-",
      kernel: "-",
      uptime: "-",
      docker: "-",
    });
  }

  try {
    const [hostname, os, kernel, uptime, dockerVersion] = await Promise.all([
      runSSHCommand("hostname"),
      runSSHCommand("cat /etc/os-release | grep PRETTY_NAME | cut -d'\"' -f2"),
      runSSHCommand("uname -r"),
      runSSHCommand("uptime -p 2>/dev/null || uptime"),
      runSSHCommand("docker --version 2>/dev/null || echo 'Not installed'"),
    ]);

    return NextResponse.json({
      hostname: hostname.trim(),
      os: os.trim(),
      kernel: kernel.trim(),
      uptime: uptime.trim(),
      docker: dockerVersion.trim(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "SSH bağlantısı başarısız", details: String(error) },
      { status: 500 }
    );
  }
}
