"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string;
  status: string;
  transcription?: string | null;
  errorMessage?: string;
  createdAt: string;
};

export default function HistoricoPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [origin, setOrigin] = useState<string>("all");
  const [modalItem, setModalItem] = useState<Item | null>(null);
  const [copied, setCopied] = useState(false);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  async function load() {
    const res = await fetch("/api/transcriptions/list");
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function remove(id: string) {
    if (deletingIds.includes(id)) return;
    setDeletingIds((prev) => [...prev, id]);
    // otimista: esconder imediatamente
    setDeletedIds((prev) => [...prev, id]);
    try {
      const res = await fetch(`/api/transcriptions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // rollback se falhar
        setDeletedIds((prev) => prev.filter((x) => x !== id));
      } else {
        // também remover do array original para evitar retorno futuro
        setItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch {
      setDeletedIds((prev) => prev.filter((x) => x !== id));
    } finally {
      setDeletingIds((prev) => prev.filter((x) => x !== id));
    }
  }

  const filtered = useMemo(() => {
    return items
      .filter((i) => !deletedIds.includes(i.id))
      .filter((i) => {
        const matchQ = q
          ? (i.title?.toLowerCase().includes(q.toLowerCase()) ||
             i.sourceUrl?.toLowerCase().includes(q.toLowerCase()) ||
             i.transcription?.toLowerCase().includes(q.toLowerCase()) ||
             i.errorMessage?.toLowerCase().includes(q.toLowerCase()))
           : true;
        const matchStatus = status === "all" ? true : i.status === status;
        const matchOrigin = origin === "all" ? true : i.sourceType === origin;
        return matchQ && matchStatus && matchOrigin;
      });
  }, [items, q, status, origin, deletedIds]);

  function statusStyle(s: string) {
    if (s === "completed") return "bg-green-700/60 text-green-100 border border-green-600/40";
    if (s === "error") return "bg-red-700/60 text-red-100 border border-red-600/40";
    return "bg-yellow-700/60 text-yellow-100 border border-yellow-600/40 animate-pulse"; // processing
  }

  function statusLabel(s: string) {
    if (s === "completed") return "Concluído";
    if (s === "error") return "Erro";
    return "Processando";
  }

  // Dentro do card, mostrar um resumo do erro se existir
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Histórico</h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-1">
          <label className="label">Pesquisa</label>
          <div className="group flex items-center w-full rounded bg-gray-700 border border-gray-600 focus-within:ring-2 focus-within:ring-violet-600 px-3 h-12">
            <span className="text-gray-400 group-focus-within:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <span className="mx-3 h-5 w-px bg-gray-500/30 group-focus-within:bg-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por título, URL ou texto da transcrição..."
              className="w-full bg-transparent outline-none text-white placeholder:text-gray-400"
            />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <div className="group flex items-center w-full rounded bg-gray-700 border border-gray-600 focus-within:ring-2 focus-within:ring-violet-600 px-3 h-12">
            <span className="text-gray-400 group-focus-within:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M7 9h10M7 13h10" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <span className="mx-3 h-5 w-px bg-gray-500/30 group-focus-within:bg-white/40" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-transparent outline-none text-white">
              <option value="all">Todos</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
              <option value="error">Erro</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Origem</label>
          <div className="group flex items-center w-full rounded bg-gray-700 border border-gray-600 focus-within:ring-2 focus-within:ring-violet-600 px-3 h-12">
            <span className="text-gray-400 group-focus-within:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M3 12h18M12 3a12 12 0 0 1 0 18M12 3a12 12 0 0 0 0 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
            <span className="mx-3 h-5 w-px bg-gray-500/30 group-focus-within:bg-white/40" />
            <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full bg-transparent outline-none text-white">
              <option value="all">Todas</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
              <option value="Arquivos">Arquivos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <p className="text-gray-400">Nenhuma transcrição encontrada</p>
        )}
        {filtered.map((it) => (
          <div key={it.id} className={`card text-left w-full ${deletingIds.includes(it.id) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !deletingIds.includes(it.id) && setModalItem(it)}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{it.title}</h3>
                <p className="text-sm text-gray-400">
                  {it.sourceType} • {new Date(it.createdAt).toLocaleString()}
                </p>
                {/* Mensagem de erro removida do card; será exibida dentro do modal */}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded text-xs sm:text-sm ${statusStyle(it.status)}`}>
                  {statusLabel(it.status)}
                </span>
                <button
                   type="button"
                   disabled={deletingIds.includes(it.id)}
                   onClick={(e) => { e.stopPropagation(); remove(it.id); }}
                   className="btn btn-secondary p-2"
                   aria-label={deletingIds.includes(it.id) ? 'Excluindo' : 'Excluir'}
                   title={deletingIds.includes(it.id) ? 'Excluindo...' : 'Excluir'}
                 >
                   {deletingIds.includes(it.id) ? (
                     <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                       <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" opacity="0.75"/>
                     </svg>
                   ) : (
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                       <path d="M3 6h18" stroke="currentColor" strokeWidth="2"/>
                       <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2"/>
                       <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2"/>
                       <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2"/>
                     </svg>
                   )}
                 </button>
              </div>
            </div>
            {it.sourceUrl && (
              <span className="text-xs text-gray-400 hover:text-gray-200 underline">
                {it.sourceUrl}
              </span>
            )}
          </div>
        ))}
      </div>
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalItem(null)}></div>
          <div className="relative w-full max-w-3xl card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-xl">{modalItem.title}</h3>
                <p className="text-sm text-gray-400">
                  {modalItem.sourceType} • {new Date(modalItem.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => { if (!modalItem?.transcription) return; await navigator.clipboard.writeText(modalItem.transcription); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="btn btn-secondary flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {copied ? "Copiado!" : "Copiar"}
                </button>
                <button onClick={() => setModalItem(null)} className="btn">Fechar</button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              <pre className="whitespace-pre-wrap text-gray-200 text-sm bg-gray-900/60 p-3 rounded border border-gray-800/60">
                {modalItem.transcription}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}