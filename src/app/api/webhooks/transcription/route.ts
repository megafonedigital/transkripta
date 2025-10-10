import { NextResponse } from "next/server";
import { appendLog, readTranscriptions, writeTranscriptions, TranscriptionItem } from "@/lib/fsdb";

export async function POST(req: Request) {
  const payload: unknown = await req.json();
  const outer = Array.isArray(payload) ? payload[0] : payload;
  const obj = typeof outer === "object" && outer !== null ? ((outer as Record<string, unknown>).body ?? outer) as Record<string, unknown> : {};

  const id = obj.id as string | undefined;
  const output = obj.output as Record<string, unknown> | undefined;
  const statusRaw = (obj.status as string | undefined) ?? "processing";
  const input = obj.input as Record<string, unknown> | undefined;
  const errorMessage = typeof obj.error === "string" ? obj.error : undefined;

  // Normaliza possíveis crases/espacos em URLs vindas de integrações
  const audioInput = input?.audio as string | undefined;
  const audioNormalized = typeof audioInput === "string" ? audioInput.replace(/`/g, "").trim() : audioInput;

  let transcriptionText: string | null = null;
  if (output) {
    if (typeof output.transcription === "string") {
      transcriptionText = output.transcription;
    } else if (Array.isArray(output.segments)) {
      const segs = output.segments as Array<{ text?: string }>;
      transcriptionText = segs.map((s) => s.text ?? "").join(" ");
    }
  }

  const items = await readTranscriptions();
  const idx = id ? items.findIndex((i) => i.id === id) : -1;
  if (idx >= 0) {
    // Regra simples: se veio error no body, força status como erro
    const hasError = !!errorMessage || statusRaw === "failed" || statusRaw === "error";
    const mappedStatus: TranscriptionItem["status"] =
      hasError ? "error" :
      statusRaw === "succeeded" ? "completed" :
      statusRaw === "processing" ? "processing" : "processing";
    items[idx].status = mappedStatus;
    items[idx].audioUrl = audioNormalized || items[idx].audioUrl;
    items[idx].transcription = transcriptionText;
    if (errorMessage) {
      items[idx].errorMessage = errorMessage;
    }
    await writeTranscriptions(items);
  }

  await appendLog({ time: new Date().toISOString(), level: errorMessage ? "error" : "info", message: "Webhook de transcrição recebido", meta: { id, status: statusRaw, error: errorMessage } });

  return NextResponse.json({ ok: true });
}