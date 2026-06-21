export type FatigueLevel =
  | "N1"
  | "N2"
  | "N3"
  | "N4"
  | "N5"
  | "N6"
  | "N7"
  | "N8"
  | "N9";

export type ScoreValue = 0 | 1 | 2 | 3;

export type DimensionKey =
  | "sleepRecovery"
  | "physicalFatigue"
  | "activityTolerance"
  | "lowMood"
  | "cognitiveSlowing"
  | "motivation";

export interface ScoreOption {
  value: ScoreValue;
  label: string;
  description: string;
}

export interface DimensionDefinition {
  key: DimensionKey;
  label: string;
  weightLabel: string;
  options: ScoreOption[];
}

export type ScoreMap = Record<DimensionKey, ScoreValue>;

export interface EntryInput {
  id?: string;
  date: string;
  time: string;
  scores: ScoreMap;
  note?: string;
}

export interface Entry extends EntryInput {
  id: string;
  totalScore: number;
  level: FatigueLevel;
  reasonTags: string[];
}

export interface DailyCandle {
  date: string;
  open: FatigueLevel;
  high: FatigueLevel;
  low: FatigueLevel;
  close: FatigueLevel;
  entryCount: number;
  isImputed: boolean;
  annotation: string | null;
}

export interface WorkbookData {
  entries: Entry[];
  dailyCandles: DailyCandle[];
}

export interface JsonStorageFile {
  version: 1;
  entries: Entry[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
