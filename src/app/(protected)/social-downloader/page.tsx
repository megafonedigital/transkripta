"use client";

import { useState } from "react";

type DownloadResult = {
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
};

type DownloadItem = {
  status?: string;
  url?: string;
  filename?: string;
  [key: string]: unknown;
};

function isArrayOfDownloadItems(v: unknown): v is DownloadItem[] {
  return Array.isArray(v) && v.every((x) => typeof x === "object" && x !== null);
}

export default function SocialDownloaderPage() {
  const [result, setResult] = useState<DownloadResult | DownloadItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = String(formData.get("url") || "");
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch("/api/downloader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data: unknown = await res.json();
      setResult(data as DownloadResult);
    } catch {
      setResult({ ok: false, error: "Falha de comunicação" });
    } finally {
      setLoading(false);
    }
  }

  const items = isArrayOfDownloadItems(result) ? result : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Social Downloader</h1>
      <form onSubmit={onSubmit} className="card space-y-5">
        <div>
          <label className="label">URL</label>
          <input name="url" placeholder="Cole a URL do conteúdo" className="w-full bg-transparent outline-none text-white placeholder:text-gray-400" />
        </div>
        <button disabled={loading} className="btn btn-primary">{loading ? "Processando..." : "Enviar"}</button>
      </form>

      {items.length > 0 && (
        <div className="card space-y-3">
          <h2 className="text-lg font-semibold">Arquivo(s) encontrado(s)</h2>
          {items.map((it, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 truncate">{it.filename || "arquivo.mp4"}</div>
                <div className="text-xs text-gray-500">{it.status || "redirect"}</div>
              </div>
              {it.url ? (
                <a
                  href={String(it.url)}
                  download={String(it.filename || "download.mp4")}
                  target="_blank"
                  rel="noopener"
                  className="btn btn-secondary"
                >
                  Baixar
                </a>
              ) : (
                <span className="text-xs text-gray-500">Sem URL</span>
              )}
            </div>
          ))}
        </div>
      )}

      {result && (
        <pre className="card whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}