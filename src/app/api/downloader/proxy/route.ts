import { NextResponse, NextRequest } from "next/server";
import { appendLog } from "@/lib/fsdb";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") || "";
  const filename = sanitizeFileName(searchParams.get("filename") || "download.mp4");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, { method: "GET" });
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";

    if (!upstream.ok || !upstream.body) {
      const msg = `Upstream falhou (HTTP ${upstream.status})`;
      await appendLog({ time: new Date().toISOString(), level: "error", message: "Downloader proxy upstream error", meta: { url, status: upstream.status } });
      return NextResponse.json({ error: msg }, { status: upstream.status || 502 });
    }

    const res = new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Evitar caching indevido
        "Cache-Control": "no-store",
      },
      status: 200,
    });

    await appendLog({ time: new Date().toISOString(), level: "info", message: "Downloader proxy iniciado", meta: { url, filename } });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    await appendLog({ time: new Date().toISOString(), level: "error", message: "Downloader proxy falhou", meta: { url, error: message } });
    return NextResponse.json({ error: "Falha de comunicação" }, { status: 500 });
  }
}