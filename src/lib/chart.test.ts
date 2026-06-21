import { describe, expect, it } from "vitest";
import { createCourseChartOption } from "./chart";
import { DailyCandle, Entry } from "../types";

const candles: DailyCandle[] = [
  {
    date: "2026-06-20",
    open: "N3",
    high: "N5",
    low: "N2",
    close: "N4",
    entryCount: 2,
    isImputed: false,
    annotation: null,
  },
  {
    date: "2026-06-21",
    open: "N4",
    high: "N7",
    low: "N4",
    close: "N6",
    entryCount: 1,
    isImputed: false,
    annotation: "睡眠恢复差 + 活动耐受低",
  },
  {
    date: "2026-06-22",
    open: "N6",
    high: "N6",
    low: "N6",
    close: "N6",
    entryCount: 0,
    isImputed: true,
    annotation: null,
  },
];

const entries: Entry[] = [
  {
    id: "entry-1",
    date: "2026-06-20",
    time: "08:00",
    scores: {
      sleepRecovery: 0,
      physicalFatigue: 1,
      activityTolerance: 1,
      lowMood: 0,
      cognitiveSlowing: 0,
      motivation: 0,
    },
    note: "",
    observerLevel: null,
    observerNote: "",
    totalScore: 2,
    level: "N1",
    reasonTags: ["状态总体平稳"],
  },
  {
    id: "entry-2",
    date: "2026-06-20",
    time: "20:00",
    scores: {
      sleepRecovery: 2,
      physicalFatigue: 2,
      activityTolerance: 2,
      lowMood: 2,
      cognitiveSlowing: 1,
      motivation: 1,
    },
    note: "",
    observerLevel: "N5",
    observerNote: "明显变慢",
    totalScore: 10,
    level: "N5",
    reasonTags: ["精神耗竭重", "身体疲惫重"],
  },
];

describe("createCourseChartOption", () => {
  it("inverts fatigue levels so heavier fatigue sits lower on the chart", () => {
    const option = createCourseChartOption(candles, entries);
    expect(option.yAxis.inverse).toBe(true);
    expect(option.yAxis.min).toBe(1);
    expect(option.yAxis.max).toBe(9);
  });

  it("uses phase layers plus per-day scatter points instead of cross-day lines", () => {
    const option = createCourseChartOption(candles, entries);
    expect(option.series[0]?.type).toBe("line");
    expect(option.series[0]?.markArea?.data).toHaveLength(3);
    expect(option.series[0]?.lineStyle?.opacity).toBe(0);
    expect(option.series[1]?.type).toBe("scatter");
    expect(option.series[5]?.type).toBe("scatter");
    expect(option.series[5]?.data).toHaveLength(1);
  });

  it("keeps intraday points on the same day x-position and separates observer overlay", () => {
    const option = createCourseChartOption(candles, entries);
    const intradayData = option.series[2]?.data as Array<{ value: [number, number]; count: number }>;
    expect(option.xAxis.type).toBe("value");
    expect(option.xAxis.interval).toBe(1);
    expect(option.series[2]?.data).toHaveLength(2);
    expect(intradayData[0]?.value[0]).toBe(0);
    expect(intradayData[1]?.value[0]).toBe(0);
    expect(intradayData[0]?.count).toBe(1);
    expect(option.series[4]?.data).toHaveLength(1);
    expect(option.series[6]?.data).toHaveLength(1);
  });
});
