"use client";

import { useState } from "react";

type DownloadResult = {
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
};

export default function SocialDownloaderPage() {
  const [result, setResult] = useState<DownloadResult | null>(null);
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
      setResult(typeof data === "object" && data !== null ? (data as DownloadResult) : { ok: false, error: "Resposta inválida" });
    } catch {
      setResult({ ok: false, error: "Falha de comunicação" });
    } finally {
      setLoading(false);
    }
  }

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
      {result && (
        <pre className="card whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}