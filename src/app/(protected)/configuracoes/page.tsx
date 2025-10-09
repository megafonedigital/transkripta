"use client";

import { useEffect, useState } from "react";
import type { LogItem } from "@/lib/fsdb";

export default function ConfiguracoesPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);

  async function load() {
    const res = await fetch("/api/logs");
    const data = await res.json();
    setLogs(data.logs || []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <button onClick={load} className="btn btn-secondary">Atualizar Logs</button>
      <div className="space-y-2">
        {logs.length === 0 && <p className="text-gray-400">Sem logs</p>}
        {logs.map((l, i) => (
          <div key={i} className="card text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">{new Date(l.time).toLocaleString()} • {l.level}</span>
            </div>
            <div>{l.message}</div>
            {l.meta && (
              <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-300">{JSON.stringify(l.meta, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}