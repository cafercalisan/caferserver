import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listDirectory, readFileContent, writeFileContent, isSSHConfigured } from "@/lib/ssh";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSSHConfigured()) {
    return NextResponse.json({ error: "SSH yapılandırılmamış" }, { status: 503 });
  }

  const path = req.nextUrl.searchParams.get("path") || "/root";
  const action = req.nextUrl.searchParams.get("action") || "list";

  try {
    if (action === "read") {
      const content = await readFileContent(path);
      return NextResponse.json({ path, content });
    }

    const files = await listDirectory(path);
    return NextResponse.json({ path, files });
  } catch (error) {
    return NextResponse.json(
      { error: "Dosya işlemi başarısız", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSSHConfigured()) {
    return NextResponse.json({ error: "SSH yapılandırılmamış" }, { status: 503 });
  }

  try {
    const { path, content } = await req.json();
    if (!path || content === undefined) {
      return NextResponse.json({ error: "path ve content gerekli" }, { status: 400 });
    }

    await writeFileContent(path, content);
    return NextResponse.json({ success: true, path });
  } catch (error) {
    return NextResponse.json(
      { error: "Dosya yazma başarısız", details: String(error) },
      { status: 500 }
    );
  }
}
