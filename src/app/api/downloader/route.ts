import { NextResponse } from "next/server";
import { appendLog } from "@/lib/fsdb";

function env(name: string, fallback?: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback || "";
}

export async function POST(req: Request) {
  const { url } = await req.json();
  const webhookUrl = env("N8N_WEBHOOK_DOWNLOAD");
  if (!webhookUrl) {
    await appendLog({ time: new Date().toISOString(), level: "error", message: "N8N_WEBHOOK_DOWNLOAD não configurado" });
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data: unknown = await res.json();
    await appendLog({ time: new Date().toISOString(), level: "info", message: "Download requisitado", meta: { url } });
    return NextResponse.json(data as Record<string, unknown>);
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    await appendLog({ time: new Date().toISOString(), level: "error", message: "Falha no downloader", meta: { error: message } });
    return NextResponse.json({ error: "Falha de comunicação" }, { status: 500 });
  }
}