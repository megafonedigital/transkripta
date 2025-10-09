import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const transcriptionsPath = path.join(dataDir, "transcriptions.json");
const logsPath = path.join(dataDir, "logs.json");

// Simple in-process exclusive lock per file to serialize writes
const fileLocks = new Map<string, Promise<void>>();
async function withExclusive(file: string, fn: () => Promise<void>) {
  const prev = fileLocks.get(file) ?? Promise.resolve();
  const next = prev.then(fn);
  // Store a catch-swallowed promise so future chains continue even if this one throws
  fileLocks.set(file, next.catch(() => {}));
  try {
    await next;
  } finally {
    // Cleanup lock after completion
    fileLocks.delete(file);
  }
}

function ensureFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(transcriptionsPath)) fs.writeFileSync(transcriptionsPath, "[]");
  if (!fs.existsSync(logsPath)) fs.writeFileSync(logsPath, "[]");
}

export type TranscriptionItem = {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string;
  sourceFiles?: string[]; // opcional: nomes de arquivos enviados
  audioUrl?: string;
  status: "processing" | "completed" | "error";
  transcription?: string | null;
  createdAt: string;
};

export async function readTranscriptions(): Promise<TranscriptionItem[]> {
  ensureFiles();
  const raw = await fsp.readFile(transcriptionsPath, "utf-8");
  return JSON.parse(raw) as TranscriptionItem[];
}

export async function writeTranscriptions(items: TranscriptionItem[]) {
  ensureFiles();
  await withExclusive(transcriptionsPath, async () => {
    await fsp.writeFile(transcriptionsPath, JSON.stringify(items, null, 2));
  });
}

export type LogItem = { time: string; level: "info" | "error"; message: string; meta?: Record<string, unknown> };

export async function appendLog(entry: LogItem) {
  ensureFiles();
  await withExclusive(logsPath, async () => {
    const raw = await fsp.readFile(logsPath, "utf-8");
    const logs: LogItem[] = JSON.parse(raw);
    logs.push(entry);
    await fsp.writeFile(logsPath, JSON.stringify(logs, null, 2));
  });
}

export async function readLogs(): Promise<LogItem[]> {
  ensureFiles();
  const raw = await fsp.readFile(logsPath, "utf-8");
  return JSON.parse(raw) as LogItem[];
}