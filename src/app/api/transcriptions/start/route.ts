import { NextResponse } from "next/server";
import { appendLog, readTranscriptions, writeTranscriptions, TranscriptionItem } from "@/lib/fsdb";

function env(name: string, fallback?: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback || "";
}

// Extrai mensagem de erro amigável do response do n8n, cobrindo formatos comuns (array de validação, {error}, {message})
function extractInitError(res: Response, data: unknown): { message: string } | null {
  const isErrorStatus = !res.ok;

  // Helper de acesso seguro a propriedades aninhadas, compatível com objetos e arrays
  const get = (obj: unknown, path: (string | number)[]): unknown => {
    let cur: unknown = obj;
    for (const seg of path) {
      if (cur === null || typeof cur !== "object") return undefined;
      if (Array.isArray(cur)) {
        const idx = typeof seg === "number" ? seg : Number.isInteger(Number(seg)) ? Number(seg) : NaN;
        if (Number.isNaN(idx) || idx < 0 || idx >= cur.length) return undefined;
        cur = cur[idx];
      } else {
        cur = (cur as Record<string, unknown>)[String(seg)];
      }
    }
    return cur;
  };

  const asObj = (v: unknown) => (typeof v === "object" && v !== null ? (v as Record<string, unknown>) : undefined);

  const tryFromValidationArray = (root: unknown): string | null => {
    const arr = Array.isArray(root) ? root : undefined;
    const first = arr && arr.length > 0 ? (arr[0] as unknown) : undefined;
    const body =
      get(first, ["json", "response", "body"]) ??
      get(first, ["response", "body"]) ??
      get(first, ["execution", "data", "resultData", "runData", "HTTP Request", 0, "json", "response", "body"]);

    if (Array.isArray(body) && body.length > 0) {
      const b0 = body[0] as unknown;
      const nameVal = get(b0, ["name"]);
      const name = typeof nameVal === "string" ? nameVal : "Input validation failed";
      const detailsVal = get(b0, ["details"]);
      const details = Array.isArray(detailsVal) ? detailsVal : [];
      const d0 = details.length > 0 ? details[0] : undefined;
      const pathPartsVal = get(d0, ["path"]);
      const pathParts = Array.isArray(pathPartsVal) ? pathPartsVal.map(String) : [];
      const msgVal = get(d0, ["message"]);
      const msg = typeof msgVal === "string" ? msgVal : "";
      if (msg) {
        return `${name}: ${pathParts.length ? pathParts.join(".") + ": " : ""}${msg}`;
      }
    }
    const topErrVal = get(first, ["error"]) ?? get(first, ["message"]);
    return typeof topErrVal === "string" ? topErrVal : null;
  };

  if (isErrorStatus) {
    if (Array.isArray(data)) {
      const msg = tryFromValidationArray(data);
      if (msg) return { message: msg };
    }
    const obj = asObj(data);
    if (obj) {
      const msg = typeof obj.error === "string" ? obj.error : (typeof obj.message === "string" ? obj.message : undefined);
      if (msg) return { message: msg };
    }
    return { message: `Falha ao iniciar transcrição: HTTP ${res.status}` };
  } else {
    if (Array.isArray(data)) {
      const msg = tryFromValidationArray(data);
      if (msg) return { message: msg };
    }
    const obj = asObj(data);
    if (obj) {
      const msg = typeof obj.error === "string" ? obj.error : (typeof obj.message === "string" ? obj.message : undefined);
      if (msg) return { message: msg };
    }
  }
  return null;
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";

  // Fluxo para uploads de arquivos (multipart/form-data)
  if (contentType.includes("multipart/form-data")) {
    const webhookFiles = env("N8N_WEBHOOK_TRANSCRICAO_ARQUIVOS");
    if (!webhookFiles) {
      await appendLog({ time: new Date().toISOString(), level: "error", message: "N8N_WEBHOOK_TRANSCRICAO_ARQUIVOS não configurado" });
      return NextResponse.json({ error: "Webhook de arquivos não configurado" }, { status: 500 });
    }

    try {
      const form = await req.formData();
      const title = String(form.get("title") || "");
      const sourceType = String(form.get("sourceType") || "Arquivos");
      const incomingFiles = form.getAll("files").filter((f) => f && typeof f !== "string") as File[];

      const fd = new FormData();
      fd.append("title", title);
      fd.append("sourceType", sourceType);
      for (const f of incomingFiles) {
        // O nome do arquivo é importante para integrações
        const name = typeof (f as { name?: string }).name === "string" ? (f as { name?: string }).name! : "file";
        fd.append("files", f, name);
      }

      const n8nRes = await fetch(webhookFiles, { method: "POST", body: fd });
      let n8nData: unknown = {};
      try { n8nData = await n8nRes.json(); } catch { n8nData = {}; }

      const initErr = extractInitError(n8nRes, n8nData);
      const n8nObj = typeof n8nData === "object" && n8nData !== null ? (n8nData as Record<string, unknown>) : {};
      const id = (n8nObj.id as string) || (Array.isArray(n8nData) && typeof n8nData[0] === "object" && n8nData[0] !== null ? (n8nData[0] as Record<string, unknown>).id as string : undefined) || crypto.randomUUID();

      if (initErr) {
        const items = await readTranscriptions();
        const errorItem: TranscriptionItem = {
          id,
          title: title || (incomingFiles[0]?.name ?? "Arquivos"),
          sourceType: sourceType || "Arquivos",
          sourceUrl: "",
          sourceFiles: incomingFiles.map((f) => (typeof (f as { name?: string }).name === "string" ? (f as { name?: string }).name! : "file")),
          status: "error",
          errorMessage: initErr.message,
          createdAt: new Date().toISOString(),
        };
        items.unshift(errorItem);
        await writeTranscriptions(items);

        await appendLog({ time: new Date().toISOString(), level: "error", message: "Falha ao iniciar processamento de arquivos (n8n retornou erro)", meta: { id, sourceType, files: incomingFiles.length, status: n8nRes.status, error: initErr.message } });

        return NextResponse.json({ error: initErr.message, id, n8n: n8nObj }, { status: n8nRes.ok ? 400 : n8nRes.status });
      }

      const status = (n8nObj.status as string) || "processing";

      const items = await readTranscriptions();
      const newItem: TranscriptionItem = {
        id,
        title: title || (incomingFiles[0]?.name ?? "Arquivos"),
        sourceType: sourceType || "Arquivos",
        sourceUrl: "",
        sourceFiles: incomingFiles.map((f) => (typeof (f as { name?: string }).name === "string" ? (f as { name?: string }).name! : "file")),
        status: status as TranscriptionItem["status"],
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      await writeTranscriptions(items);

      await appendLog({ time: new Date().toISOString(), level: "info", message: "Processamento de arquivos iniciado", meta: { id, sourceType, files: incomingFiles.length } });

      return NextResponse.json({ ok: true, id, n8n: n8nObj });
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown_error";
      await appendLog({ time: new Date().toISOString(), level: "error", message: "Falha ao iniciar processamento de arquivos", meta: { error: message } });
      return NextResponse.json({ error: "Falha de comunicação" }, { status: 500 });
    }
  }

  // Fluxo padrão para URLs (JSON)
  try {
    const body: unknown = await req.json();
    const obj = (typeof body === "object" && body !== null) ? (body as Record<string, unknown>) : {};
    const title = String(obj.title || "");
    const sourceType = String(obj.sourceType || "Instagram");
    const url = String(obj.url || "");
    const webhookUrl = env("N8N_WEBHOOK_TRANSCRICAO");
    if (!webhookUrl) {
      await appendLog({ time: new Date().toISOString(), level: "error", message: "N8N_WEBHOOK_TRANSCRICAO não configurado" });
      return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 });
    }

    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    let n8nData: unknown = {};
    try { n8nData = await n8nRes.json(); } catch { n8nData = {}; }

    const initErr = extractInitError(n8nRes, n8nData);
    const n8nObj = typeof n8nData === "object" && n8nData !== null ? (n8nData as Record<string, unknown>) : {};
    const id = (n8nObj.id as string) || (Array.isArray(n8nData) && typeof n8nData[0] === "object" && n8nData[0] !== null ? (n8nData[0] as Record<string, unknown>).id as string : undefined) || crypto.randomUUID();

    if (initErr) {
      const items = await readTranscriptions();
      const errorItem: TranscriptionItem = {
        id,
        title: title || url,
        sourceType: sourceType || "Instagram",
        sourceUrl: url,
        status: "error",
        errorMessage: initErr.message,
        createdAt: new Date().toISOString(),
      };
      items.unshift(errorItem);
      await writeTranscriptions(items);

      await appendLog({ time: new Date().toISOString(), level: "error", message: "Falha ao iniciar transcrição (n8n retornou erro)", meta: { id, url, sourceType, status: n8nRes.status, error: initErr.message } });

      return NextResponse.json({ error: initErr.message, id, n8n: n8nObj }, { status: n8nRes.ok ? 400 : n8nRes.status });
    }

    const status = (n8nObj.status as string) || "processing";
    const items = await readTranscriptions();
    const newItem: TranscriptionItem = {
      id,
      title: title || url,
      sourceType: sourceType || "Instagram",
      sourceUrl: url,
      status: status as TranscriptionItem["status"],
      createdAt: new Date().toISOString(),
    };
    items.unshift(newItem);
    await writeTranscriptions(items);

    await appendLog({ time: new Date().toISOString(), level: "info", message: "Transcrição iniciada", meta: { id, url, sourceType } });

    return NextResponse.json({ ok: true, id, n8n: n8nObj });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    await appendLog({ time: new Date().toISOString(), level: "error", message: "Falha ao iniciar transcrição", meta: { error: message } });
    return NextResponse.json({ error: "Falha de comunicação" }, { status: 500 });
  }
}
