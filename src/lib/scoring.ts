import { DIMENSIONS, LEVELS } from "../constants";
import { DailyCandle, DimensionKey, Entry, EntryInput, FatigueLevel, ScoreMap } from "../types";

const REASON_LABELS: Record<DimensionKey, string> = {
  sleepRecovery: "精神耗竭重",
  physicalFatigue: "身体疲惫重",
  activityTolerance: "启动困难重",
  lowMood: "情绪下沉重",
  cognitiveSlowing: "头脑迟滞重",
  motivation: "接触他人困难",
};

const LEVEL_TO_NUMBER: Record<FatigueLevel, number> = {
  N1: 1,
  N2: 2,
  N3: 3,
  N4: 4,
  N5: 5,
  N6: 6,
  N7: 7,
  N8: 8,
  N9: 9,
};

const SCORE_BANDS = [
  { max: 2, level: "N1" },
  { max: 4, level: "N2" },
  { max: 6, level: "N3" },
  { max: 8, level: "N4" },
  { max: 10, level: "N5" },
  { max: 12, level: "N6" },
  { max: 14, level: "N7" },
  { max: 16, level: "N8" },
  { max: 18, level: "N9" },
] as const satisfies Array<{ max: number; level: FatigueLevel }>;

export function sumScores(scores: ScoreMap): number {
  return Object.values(scores).reduce<number>((total, score) => total + score, 0);
}

export function levelFromScore(totalScore: number, scores: ScoreMap): FatigueLevel {
  let baseLevel = SCORE_BANDS.find((band) => totalScore <= band.max)?.level ?? "N9";
  const severePhysical = scores.physicalFatigue === 3 || scores.activityTolerance === 3;
  const currentLevelNumber = LEVEL_TO_NUMBER[baseLevel];
  const nearUpperBoundary = totalScore === Math.min(currentLevelNumber * 2, 18);

  if (severePhysical && nearUpperBoundary && currentLevelNumber < 9) {
    baseLevel = LEVELS[currentLevelNumber];
  }

  return baseLevel;
}

export function buildReasonTags(scores: ScoreMap): string[] {
  const ranked = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, value]) => value > 0);

  if (ranked.length === 0) {
    return ["状态总体平稳"];
  }

  return ranked.slice(0, 2).map(([key]) => REASON_LABELS[key as DimensionKey]);
}

export function scoreEntry(input: EntryInput): Entry {
  const totalScore = sumScores(input.scores);
  const level = levelFromScore(totalScore, input.scores);
  const reasonTags = buildReasonTags(input.scores);

  return {
    ...input,
    id: input.id ?? crypto.randomUUID(),
    note: input.note?.trim() ?? "",
    totalScore,
    level,
    reasonTags,
  };
}

function compareDateTime(left: Entry, right: Entry): number {
  return `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`);
}

function levelNumber(level: FatigueLevel): number {
  return LEVEL_TO_NUMBER[level];
}

function numberToLevel(value: number): FatigueLevel {
  return `N${value}` as FatigueLevel;
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function buildDailyCandles(entries: Entry[]): DailyCandle[] {
  if (entries.length === 0) {
    return [];
  }

  const sorted = [...entries].sort(compareDateTime);
  const grouped = new Map<string, Entry[]>();

  for (const entry of sorted) {
    const dayEntries = grouped.get(entry.date) ?? [];
    dayEntries.push(entry);
    grouped.set(entry.date, dayEntries);
  }

  const dates = enumerateDates(sorted[0].date, sorted[sorted.length - 1].date);
  const candles: DailyCandle[] = [];
  let previousClose: FatigueLevel | null = null;

  for (const date of dates) {
    const dayEntries = grouped.get(date);

    if (!dayEntries || dayEntries.length === 0) {
      if (!previousClose) {
        continue;
      }

      candles.push({
        date,
        open: previousClose,
        high: previousClose,
        low: previousClose,
        close: previousClose,
        entryCount: 0,
        isImputed: true,
        annotation: null,
      });
      continue;
    }

    const ordered = [...dayEntries].sort(compareDateTime);
    const levels = ordered.map((item) => levelNumber(item.level));
    const closeEntry = ordered[ordered.length - 1];
    const closeLevel = closeEntry.level;

    candles.push({
      date,
      open: ordered[0].level,
      high: numberToLevel(Math.max(...levels)),
      low: numberToLevel(Math.min(...levels)),
      close: closeLevel,
      entryCount: ordered.length,
      isImputed: false,
      annotation: levelNumber(closeLevel) > 5 ? closeEntry.reasonTags.join(" + ") : null,
    });

    previousClose = closeLevel;
  }

  return candles;
}

export function createDefaultScores(): ScoreMap {
  return DIMENSIONS.reduce<ScoreMap>((accumulator, dimension) => {
    accumulator[dimension.key] = 0;
    return accumulator;
  }, {} as ScoreMap);
}
