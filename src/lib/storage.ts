import { Entry, JsonStorageFile, ValidationResult, WorkbookData } from "../types";
import { buildDailyCandles, scoreEntry } from "./scoring";

function serializeStorage(entries: Entry[]): JsonStorageFile {
  return {
    version: 1,
    entries: [...entries].sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`)),
  };
}

export function validateStorageFile(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["JSON 内容不是有效对象。"] };
  }

  const candidate = data as Partial<JsonStorageFile>;
  if (candidate.version !== 1) {
    errors.push("JSON 文件缺少正确的 version: 1。");
  }
  if (!Array.isArray(candidate.entries)) {
    errors.push("JSON 文件缺少 entries 数组。");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildWorkbookData(entries: Entry[]): WorkbookData {
  return {
    entries,
    dailyCandles: buildDailyCandles(entries),
  };
}

export function hydrateEntries(rawEntries: Entry[]): Entry[] {
  return rawEntries.map((entry) =>
    scoreEntry({
      id: entry.id,
      date: entry.date,
      time: entry.time,
      scores: entry.scores,
      note: entry.note,
      observerLevel: entry.observerLevel ?? null,
      observerNote: entry.observerNote ?? "",
      duringMenstruation: entry.duringMenstruation ?? false,
    }),
  );
}

export async function fetchStorage(): Promise<WorkbookData> {
  const response = await fetch("/api/records");
  if (!response.ok) {
    throw new Error("读取本地 JSON 数据失败。");
  }

  const parsed = (await response.json()) as unknown;
  const validation = validateStorageFile(parsed);
  if (!validation.valid) {
    throw new Error(validation.errors.join("\n"));
  }

  return buildWorkbookData(hydrateEntries((parsed as JsonStorageFile).entries));
}

export async function saveStorage(entries: Entry[]): Promise<WorkbookData> {
  const payload = serializeStorage(entries);
  const response = await fetch("/api/records", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "保存本地 JSON 数据失败。");
  }

  return buildWorkbookData(hydrateEntries(payload.entries));
}

export function exportJsonBackup(entries: Entry[]): void {
  const payload = JSON.stringify(serializeStorage(entries), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `抑郁症疲劳记录备份-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function summarizeCandles(workbookData: WorkbookData): string {
  if (workbookData.dailyCandles.length === 0) {
    return "当前还没有任何每日汇总。";
  }

  const last = workbookData.dailyCandles[workbookData.dailyCandles.length - 1];
  return `最近一天 ${last.date} 收盘 ${last.close}，共 ${last.entryCount} 次记录${last.isImputed ? "（自动补全）" : ""}。`;
}
