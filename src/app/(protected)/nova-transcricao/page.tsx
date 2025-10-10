"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const networks = ["Instagram", "Facebook", "TikTok", "YouTube", "Arquivos"] as const;

type SourceType = typeof networks[number];

function NetworkIcon({ name }: { name: SourceType }) {
  const common = "w-6 h-6 flex-shrink-0";
  switch (name) {
    case "Instagram":
      // Ícone de câmera simples
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="8.5" r="1.5" fill="currentColor" />
        </svg>
      );
    case "Facebook":
      // Letra F estilizada
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h2.1l.9-3H13V9c0-.6.4-1 1-1Z" />
        </svg>
      );
    case "TikTok":
      // Nota musical simples
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M15 5v9.1a3.9 3.9 0 1 1-2-3.4V7l6 1.5V6.1A5.8 5.8 0 0 1 15 5Z" />
        </svg>
      );
    case "YouTube":
      // Botão de play
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
          <path d="M10 9.5v5l5-2.5-5-2.5Z" fill="currentColor" />
        </svg>
      );
    case "Arquivos":
      // Ícone de arquivo
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6Z" stroke="currentColor" strokeWidth="2" />
          <path d="M14 3v6h6" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function NovaTranscricaoPage() {
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("Instagram");
  const [showModal, setShowModal] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const router = useRouter();

  function showError(message: string) {
    setToast({ type: "error", message });
    setTimeout(() => setToast(null), 5000);
  }

  async function onSubmitForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await onSubmit(formData);
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    const currentSourceType = String(formData.get("sourceType") || sourceType || "Instagram");

    if (currentSourceType === "Arquivos") {
      // Envia anexos via multipart/form-data
      const fd = new FormData();
      fd.append("title", String(formData.get("title") || ""));
      fd.append("sourceType", currentSourceType);
      const files = formData.getAll("files");
      for (const f of files) {
        if (f && typeof f !== "string") {
          fd.append("files", f as File);
        }
      }
      try {
        const res = await fetch("/api/transcriptions/start", {
          method: "POST",
          body: fd,
        });
        setLoading(false);
        if (!res.ok) {
          // alert("Falha ao iniciar processamento de arquivos");
          showError("Falha ao iniciar processamento de arquivos");
          return;
        }
        const data = await res.json();
        // alert("Processamento de arquivos iniciado. ID: " + (data.id || "N/A"));
        setCreatedId(data.id || "N/A");
        setShowModal(true);
      } catch {
        setLoading(false);
        // alert("Erro ao enviar arquivos");
        showError("Erro ao enviar arquivos");
      }
      return;
    }

    // Fluxo original para URLs
    try {
      const res = await fetch("/api/transcriptions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title") || ""),
          sourceType: currentSourceType,
          url: String(formData.get("url") || ""),
        }),
      });
      setLoading(false);
      if (!res.ok) {
        // alert("Falha ao iniciar transcrição");
        showError("Falha ao iniciar transcrição");
        return;
      }
      const data = await res.json();
      // alert("Transcrição iniciada. ID: " + (data.id || "N/A"));
      setCreatedId(data.id || "N/A");
      setShowModal(true);
    } catch {
      setLoading(false);
      // alert("Erro ao iniciar transcrição");
      showError("Erro ao iniciar transcrição");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Transcrição</h1>
        <p className="text-sm text-gray-400">Cole a URL, escolha o tipo de conteúdo e inicie a transcrição.</p>
      </div>
      <form onSubmit={onSubmitForm} className="card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Título da Transcrição</label>
            <div className="group flex items-center w-full rounded bg-gray-700 border border-gray-600 focus-within:ring-2 focus-within:ring-violet-600 px-3 h-12">
              <span className="text-gray-400 group-focus-within:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M14 3v6h6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <span className="mx-3 h-5 w-px bg-gray-500/30 group-focus-within:bg-white/40" />
              <input name="title" placeholder="Ex.: Live com João" className="w-full bg-transparent outline-none text-white placeholder:text-gray-400" />
            </div>
          </div>
          <div>
            <label className="label">Formato de Saída</label>
            <div className="group flex items-center w-full rounded bg-gray-700 border border-gray-600 focus-within:ring-2 focus-within:ring-violet-600 px-3 h-12">
              <span className="text-gray-400 group-focus-within:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 9h10M7 13h10" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <span className="mx-3 h-5 w-px bg-gray-500/30 group-focus-within:bg-white/40" />
              <select className="w-full bg-transparent outline-none text-white" defaultValue="Texto Simples" name="format">
                <option>Texto Simples</option>
                <option>JSON</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="label">Escolha o Tipo de Conteúdo</label>
          <div className="flex gap-2 flex-wrap">
            {networks.map((n) => (
              <label key={n} className="cursor-pointer">
                <input
                  type="radio"
                  name="sourceType"
                  value={n}
                  checked={sourceType === n}
                  onChange={() => setSourceType(n)}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center gap-2 rounded border border-gray-600 bg-gray-700/60 hover:bg-gray-700 px-3 py-2 peer-checked:bg-white/10 peer-checked:border-violet-500 peer-checked:ring-2 peer-checked:ring-violet-600 transition">
                  <NetworkIcon name={n} />
                  <span>{n}</span>
                  <svg className="w-4 h-4 text-violet-500 opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              </label>
            ))}
          </div>
        </div>
        {sourceType !== "Arquivos" ? (
          <div>
            <label className="label">URL</label>
            <div className="group flex items-center w-full rounded bg-gray-700 border border-gray-600 focus-within:ring-2 focus-within:ring-violet-600 px-3 h-12">
              <span className="text-gray-400 group-focus-within:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <span className="mx-3 h-5 w-px bg-gray-500/30 group-focus-within:bg-white/40" />
              <input name="url" placeholder="Cole a URL do conteúdo" className="w-full bg-transparent outline-none text-white placeholder:text-gray-400" />
            </div>
          </div>
        ) : (
          <div>
            <label className="label">Selecione arquivos (áudio/vídeo)</label>
            <div className="group flex items-center w-full rounded bg-gray-700 border border-gray-600 focus-within:ring-2 focus-within:ring-violet-600 px-3 h-12">
              <span className="text-gray-400 group-focus-within:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M14 3v6h6" stroke="currentColor" strokeWidth="2" />
                </svg>
              </span>
              <span className="mx-3 h-5 w-px bg-gray-500/30 group-focus-within:bg-white/40" />
              <input
                name="files"
                type="file"
                multiple
                accept="audio/*,video/*"
                className="w-full bg-transparent outline-none text-white"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Os arquivos serão enviados em anexo para processamento.</p>
          </div>
        )}
        <button disabled={loading} className="btn btn-primary">
          {loading ? "Processando..." : sourceType === "Arquivos" ? "Enviar arquivos" : "Transcrever"}
        </button>
      </form>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-gray-800 border border-gray-700 p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Transcrição iniciada</h2>
            <p className="text-sm text-gray-300 mt-2">Seu item está sendo processado e em breve aparecerá na guia Histórico.</p>
            {createdId && <p className="text-xs text-gray-400 mt-1">ID: {createdId}</p>}
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Continuar transcrevendo</button>
              <button onClick={() => router.push('/historico')} className="btn btn-primary">Ir para histórico</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className="flex items-start gap-3 rounded-lg border p-4 shadow-lg bg-gray-800 border-red-600 text-red-100" role="alert">
            <svg className="w-5 h-5 flex-shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v6M12 16h.01" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div className="text-sm">{toast.message}</div>
            <button onClick={() => setToast(null)} className="ml-auto text-xs text-red-300 hover:text-red-200">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}