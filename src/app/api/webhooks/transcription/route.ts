import { NextResponse } from "next/server";
import { appendLog, readTranscriptions, writeTranscriptions, TranscriptionItem } from "@/lib/fsdb";

// Normaliza diferentes valores de status recebidos do provedor
function normalizeStatus(s?: string): TranscriptionItem["status"] {
  const v = (s || "").toLowerCase();
  if (["succeeded", "completed", "success", "done", "finished"].includes(v)) return "completed";
  if (["failed", "error", "erro", "fail", "failure"].includes(v)) return "error";
  // valores como "processing", "queued", "running", "pending" caem aqui
  return "processing";
}

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
  const inputUrlRaw = input?.url as string | undefined;
  const inputUrlNormalized = typeof inputUrlRaw === "string" ? inputUrlRaw.replace(/`/g, "").trim() : undefined;

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
  let idx = id ? items.findIndex((i) => i.id === id) : -1;

  // Fallback: tentar localizar pelo URL de entrada quando o ID não casa
  if (idx === -1 && inputUrlNormalized) {
    idx = items.findIndex((i) => i.sourceUrl === inputUrlNormalized && i.status === "processing");
  }

  // Fallback adicional: se já tivermos audioUrl igual
  if (idx === -1 && audioNormalized) {
    idx = items.findIndex((i) => i.audioUrl === audioNormalized && i.status === "processing");
  }

  // Fallback heurístico: se audio é googlevideo, priorizar último YouTube em processing
  if (idx === -1 && typeof audioNormalized === "string" && audioNormalized.includes("googlevideo.com")) {
    idx = items.findIndex((i) => i.sourceType === "YouTube" && i.status === "processing");
  }

  // Fallback final: pegar o item mais recente em processing
  if (idx === -1) {
    idx = items.findIndex((i) => i.status === "processing");
  }

  if (idx >= 0) {
    // Se veio erro no body, força status como erro
    const mappedStatus: TranscriptionItem["status"] = errorMessage ? "error" : normalizeStatus(statusRaw);
    items[idx].status = mappedStatus;
    items[idx].audioUrl = audioNormalized || items[idx].audioUrl;
    items[idx].transcription = transcriptionText;
    if (errorMessage) {
      items[idx].errorMessage = errorMessage;
    }
    await writeTranscriptions(items);
  } else {
    // Não encontramos item correspondente; logar para diagnóstico
    await appendLog({
      time: new Date().toISOString(),
      level: "error",
      message: "Webhook recebido, mas nenhum item correspondente foi encontrado",
      meta: { id, status: statusRaw, inputUrl: inputUrlNormalized, audio: audioNormalized },
    });
  }

  await appendLog({ time: new Date().toISOString(), level: errorMessage ? "error" : "info", message: "Webhook de transcrição recebido", meta: { id, status: statusRaw, error: errorMessage } });

  return NextResponse.json({ ok: true });
}